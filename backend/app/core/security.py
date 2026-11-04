"""Password hashing and access-token utilities."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash
from jwt.exceptions import InvalidTokenError

from app.config import settings

password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-user-password")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a plain-text password with the recommended Argon2 settings."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check a supplied password against a stored password hash."""
    return password_hasher.verify(password, password_hash)


def create_access_token(user_id: UUID) -> tuple[str, int]:
    """Create a signed JWT access token and return its lifetime in seconds."""
    now = datetime.now(timezone.utc)
    lifetime_seconds = settings.jwt_access_token_expire_minutes * 60
    claims = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=lifetime_seconds),
        "type": "access",
    }
    token = jwt.encode(
        claims,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=JWT_ALGORITHM,
    )
    return token, lifetime_seconds


def decode_access_token(token: str) -> UUID | None:
    """Validate a signed access token and return its user UUID."""
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat", "type"]},
        )
        if claims.get("type") != "access":
            return None
        return UUID(claims["sub"])
    except (InvalidTokenError, ValueError, TypeError):
        return None
