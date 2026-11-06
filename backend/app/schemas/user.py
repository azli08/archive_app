"""Public user response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRead(BaseModel):
    """User fields safe to return to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    display_name: str | None
    email_verified: bool
    created_at: datetime


class UserUpdate(BaseModel):
    """Editable current-user profile fields."""

    display_name: str | None = Field(default=None, max_length=100)
