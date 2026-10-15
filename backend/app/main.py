from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.oauth2 import id_token
from google.auth.transport import requests

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.db import SessionLocal, engine
from app.db.base import Base
from app.models import User
from app.core.security import create_access_token, create_refresh_token
from app.api.v1.auth import router as auth_router, save_refresh_token
from app.api.v1.users import router as users_router


# Import models before creating tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)


# --------------------------------------------------
# Rate Limiting
# --------------------------------------------------

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
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


# --------------------------------------------------
# Routers
# --------------------------------------------------

app.include_router(auth_router)
app.include_router(users_router)


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
@limiter.limit("5/minute")
def google_login(
    request: Request,
    response: Response,
    data: GoogleTokenRequest,
):
    db = SessionLocal()

    try:
        google_user = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            settings.google_client_id,
        )


        name = google_user.get("name", "Google User")
        email = google_user.get("email", "").lower().strip()
        email_verified = google_user.get("email_verified") is True
        picture = google_user.get("picture")

        if not email or not email_verified:
            raise HTTPException(
                status_code=401,
                detail="Google account email must be verified",
            )

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if user:
            message = "Login successful!"
        else:
            user = User(
                name=name,
                email=email,
                password=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            message = "Google account created successfully!"

        token_data = {
            "sub": str(user.id),
            "email": user.email,
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        save_refresh_token(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
        )

        # Store tokens in HttpOnly cookies, not in the response body.
        response.set_cookie(
            key=settings.access_token_cookie_name,
            value=access_token,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            path="/",
            max_age=settings.access_token_expire_minutes * 60,
        )

        response.set_cookie(
            key=settings.refresh_token_cookie_name,
            value=refresh_token,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            path="/",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        )

        return {
            "message": message,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "picture": picture,
            },
        }

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token",
        )

    finally:
        db.close()