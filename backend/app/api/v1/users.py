from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_user
from app.datamodels.auth import UserResponse
from app.models import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "is_email_verified": current_user.is_email_verified,
    }
