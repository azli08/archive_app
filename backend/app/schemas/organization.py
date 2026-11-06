"""Request and response schemas for the user's saved library."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#8b83c8", max_length=20)
    icon: str = Field(default="✳", max_length=20)


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str
    icon: str
    created_at: datetime


class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    emoji: str = Field(default="✦", max_length=12)
    color: str = Field(default="collection-lilac", max_length=32)


class CollectionRead(BaseModel):
    id: UUID
    name: str
    description: str
    emoji: str
    color: str
    bookmark_ids: list[UUID]
    created_at: datetime


class BookmarkFields(BaseModel):
    url: HttpUrl
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=10000)
    thumbnail: HttpUrl | None = None
    content_type: str = Field(default="Website", max_length=50)
    personal_note: str = Field(default="", max_length=10000)
    is_favorite: bool = False
    category_id: UUID | None = None
    tag_names: list[str] = Field(default_factory=list, max_length=30)
    collection_ids: list[UUID] = Field(default_factory=list, max_length=50)


class BookmarkCreate(BookmarkFields):
    pass


class BookmarkUpdate(BaseModel):
    url: HttpUrl | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=10000)
    thumbnail: HttpUrl | None = None
    content_type: str | None = Field(default=None, max_length=50)
    personal_note: str | None = Field(default=None, max_length=10000)
    is_favorite: bool | None = None
    category_id: UUID | None = None
    tag_names: list[str] | None = Field(default=None, max_length=30)
    collection_ids: list[UUID] | None = Field(default=None, max_length=50)


class BookmarkRead(BaseModel):
    id: UUID
    url: str
    title: str
    description: str
    thumbnail: str | None
    content_type: str
    personal_note: str
    is_favorite: bool
    category: str | None
    tag_names: list[str]
    collection_ids: list[UUID]
    created_at: datetime
    updated_at: datetime


class BookmarkPage(BaseModel):
    items: list[BookmarkRead]
    total: int
    page: int
    page_size: int
