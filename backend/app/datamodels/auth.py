from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_email_verified: bool


class SignupUserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr


class SignupResponse(BaseModel):
    message: str
    user: SignupUserResponse


class GoogleUserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    picture: str | None = None


class GoogleLoginResponse(BaseModel):
    message: str
    user: GoogleUserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class GoogleTokenRequest(BaseModel):
    credential: str = Field(min_length=1)
