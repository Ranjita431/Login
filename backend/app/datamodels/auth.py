
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_email_verified: bool


class SignupUserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr


class SignupResponse(BaseModel):
    message: str
    user: SignupUserResponse


class GoogleUserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    picture: str | None = None


class GoogleLoginResponse(BaseModel):
    message: str
    user: GoogleUserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class GoogleTokenRequest(BaseModel):
    credential: str