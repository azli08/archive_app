"""Basic password length limits for account registration."""

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


def validate_password(password: str) -> str:
    """Enforce only basic length limits; advanced checks are deferred."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password must be no more than {MAX_PASSWORD_LENGTH} characters long")
    return password
