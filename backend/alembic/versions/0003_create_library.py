"""Create user library tables.

Revision ID: 0003_create_library
Revises: 0002_create_users
Create Date: 2026-11-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_create_library"
down_revision: Union[str, None] = "0002_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.Column("icon", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_categories_user_name", "categories", ["user_id", "name"], unique=True)

    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_tags_user_name", "tags", ["user_id", "name"], unique=True)

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("emoji", sa.String(length=12), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_collections_user_name", "collections", ["user_id", "name"], unique=True)

    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("category_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("normalized_url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("thumbnail", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(length=50), nullable=False),
        sa.Column("personal_note", sa.Text(), nullable=False),
        sa.Column("is_favorite", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_bookmarks_user_normalized_url",
        "bookmarks",
        ["user_id", "normalized_url"],
        unique=True,
    )
    op.create_index("ix_bookmarks_user_created_at", "bookmarks", ["user_id", "created_at"])

    op.create_table(
        "bookmark_tags",
        sa.Column("bookmark_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("tag_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["bookmark_id"], ["bookmarks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("bookmark_id", "tag_id"),
    )

    op.create_table(
        "collection_items",
        sa.Column("collection_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("bookmark_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bookmark_id"], ["bookmarks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("collection_id", "bookmark_id"),
    )


def downgrade() -> None:
    op.drop_table("collection_items")
    op.drop_table("bookmark_tags")
    op.drop_index("ix_bookmarks_user_created_at", table_name="bookmarks")
    op.drop_index("uq_bookmarks_user_normalized_url", table_name="bookmarks")
    op.drop_table("bookmarks")
    op.drop_index("uq_collections_user_name", table_name="collections")
    op.drop_table("collections")
    op.drop_index("uq_tags_user_name", table_name="tags")
    op.drop_table("tags")
    op.drop_index("uq_categories_user_name", table_name="categories")
    op.drop_table("categories")
