"""User registration business logic."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import DUMMY_PASSWORD_HASH, hash_password, verify_password
from app.models import User


class EmailAlreadyRegistered(Exception):
    """Raised when an account already uses the requested email address."""


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    """Verify credentials, using a dummy hash for unknown email addresses."""
    user = db.scalar(select(User).where(User.email == email))
    stored_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    password_matches = verify_password(password, stored_hash)
    if user is None or not password_matches:
        return None
    return user


def register_user(
    db: Session,
    *,
    email: str,
    password: str,
    display_name: str | None,
) -> User:
    """Create an account while handling duplicate email races safely."""
    existing_user = db.scalar(select(User.id).where(User.email == email))
    if existing_user is not None:
        raise EmailAlreadyRegistered

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegistered from exc

    db.refresh(user)
    return user
