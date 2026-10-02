from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.oauth2 import id_token
from google.auth.transport import requests

from database import Base, engine, SessionLocal
from models import User, PasswordReset

from datetime import datetime, timedelta, timezone
import bcrypt
import secrets
import os
from pathlib import Path

from dotenv import load_dotenv

from email.message import EmailMessage
import aiosmtplib


# --------------------------------------------------
# Load environment variables
# --------------------------------------------------

# main.py is inside:
# backend/venv/main.py
#
# .env is inside:
# backend/.env

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------

app = FastAPI()


# --------------------------------------------------
# Create database tables
# --------------------------------------------------

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# Google OAuth Client ID
# --------------------------------------------------

GOOGLE_CLIENT_ID = (
    "484994562541-otpt7tlqq44c1lcacps3qq6bvsua6him"
    ".apps.googleusercontent.com"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request Models
# --------------------------------------------------

class GoogleTokenRequest(BaseModel):
    credential: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


# --------------------------------------------------
# Root route
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "FastAPI backend is running!"
    }


# --------------------------------------------------
# Google Login
# --------------------------------------------------

@app.post("/auth/google")
def google_login(data: GoogleTokenRequest):

    db = SessionLocal()

    try:

        # Verify Google token
        google_user = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        google_id = google_user["sub"]
        name = google_user.get("name", "Google User")
        email = google_user.get("email", "").lower().strip()
        picture = google_user.get("picture")

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Google account email not available"
            )

        # Check whether this email already exists
        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        # --------------------------------------------------
        # Existing user
        # --------------------------------------------------

        if existing_user:

            return {
                "message": "Login successful!",
                "user": {
                    "id": existing_user.id,
                    "name": existing_user.name,
                    "email": existing_user.email,
                    "picture": picture
                }
            }

        # --------------------------------------------------
        # New Google user
        # --------------------------------------------------

        new_user = User(
            name=name,
            email=email,
            password=None
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Google account created successfully!",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "picture": picture
            }
        }

    except ValueError:

        raise HTTPException(
            status_code=401,
            detail="Invalid Google token"
        )

    finally:
        db.close()


# --------------------------------------------------
# Email/Password Signup
# --------------------------------------------------

@app.post("/auth/signup")
def signup(data: SignupRequest):

    db = SessionLocal()

    try:

        email = data.email.lower().strip()

        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        if len(data.password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters"
            )

        if len(data.password.encode("utf-8")) > 72:
            raise HTTPException(
                status_code=400,
                detail="Password must be 72 bytes or less"
            )

        hashed_password = bcrypt.hashpw(
            data.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            name=data.name.strip(),
            email=email,
            password=hashed_password
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Account created successfully!",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email
            }
        }

    finally:
        db.close()


# --------------------------------------------------
# Email/Password Login
# --------------------------------------------------

@app.post("/auth/login")
def login(data: LoginRequest):

    db = SessionLocal()

    try:

        email = data.email.lower().strip()

        user = db.query(User).filter(
            User.email == email
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not user.password:
            raise HTTPException(
                status_code=400,
                detail="This account uses Google login. Please sign in with Google."
            )

        password_matches = bcrypt.checkpw(
            data.password.encode("utf-8"),
            user.password.encode("utf-8")
        )

        if not password_matches:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful!",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }

    finally:
        db.close()


# --------------------------------------------------
# Forgot Password - Request Reset Code
# --------------------------------------------------

@app.post("/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest):

    db = SessionLocal()

    try:

        email = data.email.lower().strip()

        user = db.query(User).filter(
            User.email == email
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="No account found with this email"
            )

        if not user.password:
            raise HTTPException(
                status_code=400,
                detail="This account uses Google login. Please sign in with Google."
            )

        # Remove old reset codes for this email
        old_resets = db.query(PasswordReset).filter(
            PasswordReset.email == email
        ).all()

        for reset in old_resets:
            db.delete(reset)

        # Generate a secure 6-digit reset code
        code = str(secrets.randbelow(900000) + 100000)

        # Code expires after 10 minutes
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        reset_request = PasswordReset(
            email=email,
            token=code,
            expires_at=expires_at
        )

        db.add(reset_request)
        db.commit()

        # --------------------------------------------------
        # Send reset code by email
        # --------------------------------------------------

        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")

        if not smtp_email or not smtp_password:
            raise HTTPException(
                status_code=500,
                detail="Email service is not configured"
            )

        message = EmailMessage()

        message["From"] = smtp_email
        message["To"] = email
        message["Subject"] = "Password Reset Code"

        message.set_content(
            f"""Hello,

We received a request to reset your password.

Your password reset code is: {code}

This code will expire in 10 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.

Regards,
Login Authentication System
"""
        )

        try:

            awaitable = aiosmtplib.send(
                message,
                hostname="smtp.gmail.com",
                port=587,
                start_tls=True,
                username=smtp_email,
                password=smtp_password,
            )

            import asyncio

            asyncio.run(awaitable)

        except Exception as email_error:

            # Remove the reset code if the email could not be sent.
            db.delete(reset_request)
            db.commit()

            print(f"Email sending failed: {email_error}")

            raise HTTPException(
                status_code=500,
                detail="Could not send password reset email"
            )

        return {
            "message": "Password reset code sent to your email."
        }

    finally:
        db.close()


# --------------------------------------------------
# Reset Password
# --------------------------------------------------

@app.post("/auth/reset-password")
def reset_password(data: ResetPasswordRequest):

    db = SessionLocal()

    try:

        email = data.email.lower().strip()

        if len(data.new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters"
            )

        if len(data.new_password.encode("utf-8")) > 72:
            raise HTTPException(
                status_code=400,
                detail="Password must be 72 bytes or less"
            )

        reset_request = db.query(PasswordReset).filter(
            PasswordReset.email == email,
            PasswordReset.token == data.code
        ).first()

        if not reset_request:
            raise HTTPException(
                status_code=400,
                detail="Invalid reset code"
            )

        now = datetime.now(timezone.utc)

        # SQLite may return a timezone-naive datetime
        expires_at = reset_request.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:

            db.delete(reset_request)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="Reset code has expired"
            )

        user = db.query(User).filter(
            User.email == email
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Hash new password
        hashed_password = bcrypt.hashpw(
            data.new_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user.password = hashed_password

        # Code can only be used once
        db.delete(reset_request)

        db.commit()

        return {
            "message": "Password reset successfully!"
        }

    finally:
        db.close()