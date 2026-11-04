"""Authentication request schemas."""

from pydantic import BaseModel, EmailStr, Field, SecretStr, field_validator, model_validator

from app.core.password_policy import validate_password


class UserRegistration(BaseModel):
    """Validated input for creating a new account."""

    email: EmailStr
    password: SecretStr
    password_confirmation: SecretStr
    display_name: str | None = Field(default=None, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        """Store email addresses in a consistent lowercase form."""
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def validate_registration_password(cls, value: SecretStr) -> SecretStr:
        """Apply the current basic password length limits."""
        validate_password(value.get_secret_value())
        return value

    @field_validator("display_name", mode="before")
    @classmethod
    def normalize_display_name(cls, value: object) -> object:
        """Trim a supplied display name and treat blank input as omitted."""
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @model_validator(mode="after")
    def passwords_must_match(self) -> "UserRegistration":
        """Reject registration if password confirmation differs."""
        if self.password.get_secret_value() != self.password_confirmation.get_secret_value():
            raise ValueError("Password and password_confirmation must match")
        return self


class UserLogin(BaseModel):
    """Validated credentials for email/password login."""

    email: EmailStr
    password: SecretStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        """Match the normalized email format used at registration."""
        return value.strip().lower() if isinstance(value, str) else value


class TokenResponse(BaseModel):
    """Short-lived access token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
