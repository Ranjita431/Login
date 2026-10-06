from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.main import limiter

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.db import get_db
from app.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
)
from app.models import PasswordReset, RefreshToken
from app.services.email_service import send_password_reset_email


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def save_refresh_token(
    db: Session,
    user_id: int,
    refresh_token: str,
):
    payload = decode_token(refresh_token)

    expires_at = datetime.fromtimestamp(
        payload["exp"],
        tz=timezone.utc,
    ).replace(tzinfo=None)

    token_record = RefreshToken(
        user_id=user_id,
        token_id=payload["jti"],
        expires_at=expires_at,
    )

    db.add(token_record)
    db.commit()

    return token_record


@router.post("/signup")
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )

    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or less",
        )

    user = create_user(
        db=db,
        name=data.name.strip(),
        email=email,
        password=data.password,
    )

    return {
        "message": "Account created successfully!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    user = authenticate_user(
        db=db,
        email=email,
        password=data.password,
    )

    if not user:
        existing_user = get_user_by_email(db, email)

        if existing_user and not existing_user.password:
            raise HTTPException(
                status_code=400,
                detail="This account uses Google login. Please sign in with Google.",
            )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        {"sub": str(user.id)}
    )

    refresh_token = create_refresh_token(
        {"sub": str(user.id)}
    )

    save_refresh_token(
        db=db,
        user_id=user.id,
        refresh_token=refresh_token,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    # Decode and validate the JWT.
    try:
        payload = decode_token(data.refresh_token)

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    # Make sure this is actually a refresh token.
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    token_id = payload.get("jti")

    # Both the user ID and JWT ID are required.
    if not user_id or not token_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
        )

    # Find the refresh token in the database.
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_id == token_id)
        .first()
    )

    if not stored_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has been revoked or is invalid",
        )

    # Prevent reuse of an already-rotated refresh token.
    if stored_token.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has already been used",
        )

    # Check database expiration.
    now = datetime.now(timezone.utc)

    expires_at = stored_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        stored_token.revoked_at = (
            datetime.now(timezone.utc)
            .replace(tzinfo=None)
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Refresh token has expired",
        )

    # Revoke the old refresh token.
    stored_token.revoked_at = (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )

    # Create a new access token.
    access_token = create_access_token(
        {"sub": user_id}
    )

    # Create a completely new refresh token.
    new_refresh_token = create_refresh_token(
        {"sub": user_id}
    )

    # Store the new refresh token.
    save_refresh_token(
        db=db,
        user_id=int(user_id),
        refresh_token=new_refresh_token,
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(data.refresh_token)

    except JWTError:
        # The token is already invalid/expired.
        # We can still consider the user logged out.
        return {
            "message": "Logged out successfully"
        }

    if payload.get("type") != "refresh":
        return {
            "message": "Logged out successfully"
        }

    token_id = payload.get("jti")

    if token_id:
        stored_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_id == token_id)
            .first()
        )

        if stored_token and stored_token.revoked_at is None:
            stored_token.revoked_at = (
                datetime.now(timezone.utc)
                .replace(tzinfo=None)
            )

            db.commit()

    return {
        "message": "Logged out successfully"
    }


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email",
        )

    if not user.password:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google login. Please sign in with Google.",
        )

    old_resets = (
        db.query(PasswordReset)
        .filter(PasswordReset.email == email)
        .all()
    )

    for reset in old_resets:
        db.delete(reset)

    code = str(secrets.randbelow(900000) + 100000)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=10)
    )

    reset_request = PasswordReset(
        email=email,
        token=code,
        expires_at=expires_at,
    )

    db.add(reset_request)
    db.commit()

    try:
        await send_password_reset_email(
            recipient_email=email,
            reset_code=code,
        )

    except Exception as email_error:
        db.delete(reset_request)
        db.commit()

        print(f"Email sending failed: {email_error}")

        raise HTTPException(
            status_code=500,
            detail="Could not send password reset email",
        )

    return {
        "message": "Password reset code sent to your email."
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )

    if len(data.new_password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or less",
        )

    reset_request = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.email == email,
            PasswordReset.token == data.code,
        )
        .first()
    )

    if not reset_request:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset code",
        )

    now = datetime.now(timezone.utc)

    expires_at = reset_request.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        db.delete(reset_request)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Reset code has expired",
        )

    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    from app.services.auth_service import hash_password

    user.password = hash_password(data.new_password)

    # Reset code can only be used once.
    db.delete(reset_request)

    db.commit()

    return {
        "message": "Password reset successfully!"
    }