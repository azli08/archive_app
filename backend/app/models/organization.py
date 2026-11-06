"""Bookmark organization entities and many-to-many link tables."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Table,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

bookmark_tags = Table(
    "bookmark_tags",
    Base.metadata,
    Column("bookmark_id", Uuid(as_uuid=True), ForeignKey("bookmarks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

collection_items = Table(
    "collection_items",
    Base.metadata,
    Column("collection_id", Uuid(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
    Column("bookmark_id", Uuid(as_uuid=True), ForeignKey("bookmarks.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    """A user-owned bookmark category."""

    __tablename__ = "categories"
    __table_args__ = (Index("uq_categories_user_name", "user_id", "name", unique=True),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#8b83c8")
    icon: Mapped[str] = mapped_column(String(20), nullable=False, default="✳")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    bookmarks: Mapped[list["Bookmark"]] = relationship(back_populates="category")


class Tag(Base):
    """A user-owned tag shared by their bookmarks."""

    __tablename__ = "tags"
    __table_args__ = (Index("uq_tags_user_name", "user_id", "name", unique=True),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    bookmarks: Mapped[list["Bookmark"]] = relationship(secondary=bookmark_tags, back_populates="tags")


class Collection(Base):
    """A user-owned group of bookmarks."""

    __tablename__ = "collections"
    __table_args__ = (Index("uq_collections_user_name", "user_id", "name", unique=True),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    emoji: Mapped[str] = mapped_column(String(12), nullable=False, default="✦")
    color: Mapped[str] = mapped_column(String(32), nullable=False, default="collection-lilac")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    bookmarks: Mapped[list["Bookmark"]] = relationship(secondary=collection_items, back_populates="collections")


class Bookmark(Base):
    """A saved URL and its user-specific metadata."""

    __tablename__ = "bookmarks"
    __table_args__ = (
        Index("uq_bookmarks_user_normalized_url", "user_id", "normalized_url", unique=True),
        Index("ix_bookmarks_user_created_at", "user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    thumbnail: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Website")
    personal_note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    category: Mapped[Category | None] = relationship(back_populates="bookmarks")
    tags: Mapped[list[Tag]] = relationship(secondary=bookmark_tags, back_populates="bookmarks")
    collections: Mapped[list[Collection]] = relationship(secondary=collection_items, back_populates="bookmarks")
