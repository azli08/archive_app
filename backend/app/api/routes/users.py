"""Current-user profile routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead, summary="Get the current user profile")
def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    """Return the profile associated with the caller's access token."""
    return current_user


@router.patch("/me", response_model=UserRead, summary="Update the current user profile")
def update_current_user(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    current_user.display_name = payload.display_name.strip() if payload.display_name else None
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
