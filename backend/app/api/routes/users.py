"""Current-user profile routes."""

from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_current_user
from app.models import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead, summary="Get the current user profile")
def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    """Return the profile associated with the caller's access token."""
    return current_user
