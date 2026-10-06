from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from slowapi.util import get_remote_address

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.db import SessionLocal, engine
from app.db.base import Base
from app.models import User
from app.core.security import create_access_token, create_refresh_token
from app.api.v1.auth import router as auth_router, save_refresh_token
from app.api.v1.users import router as users_router


# Import models before creating tables
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

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
def google_login(data: GoogleTokenRequest):
    db = SessionLocal()

    try:
        google_user = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            settings.google_client_id,
        )

        name = google_user.get("name", "Google User")
        email = google_user.get("email", "").lower().strip()
        picture = google_user.get("picture")

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Google account email not available",
            )

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            user = existing_user
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

        # Create the same JWT tokens used by normal email login.
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

        return {
            "message": message,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
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