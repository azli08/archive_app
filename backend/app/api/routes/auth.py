"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import TokenResponse, UserLogin, UserRegistration
from app.schemas.user import UserRead
from app.services.auth_service import (
    EmailAlreadyRegistered,
    authenticate_user,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: UserRegistration, db: Session = Depends(get_db)) -> UserRead:
    """Create a user account and return only public profile fields."""
    try:
        return register_user(
            db,
            email=str(payload.email),
            password=payload.password.get_secret_value(),
            display_name=payload.display_name,
        )
    except EmailAlreadyRegistered as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc


@router.post("/login", response_model=TokenResponse, summary="Log in with email and password")
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate a user and issue a short-lived bearer access token."""
    user = authenticate_user(
        db,
        email=str(payload.email),
        password=payload.password.get_secret_value(),
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token, expires_in = create_access_token(user.id)
    return TokenResponse(access_token=token, expires_in=expires_in)
