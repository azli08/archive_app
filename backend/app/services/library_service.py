"""User-scoped library operations."""

from urllib.parse import urlsplit, urlunsplit
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Bookmark, Category, Collection, Tag, User
from app.schemas.organization import (
    BookmarkCreate,
    BookmarkRead,
    BookmarkUpdate,
    CategoryCreate,
    CategoryRead,
    CollectionCreate,
    CollectionRead,
)


class LibraryItemNotFound(Exception):
    """Raised when a requested item is missing or belongs to another user."""


class DuplicateLibraryItem(Exception):
    """Raised when a user already has an item with the same unique identity."""


class InvalidLibraryReference(Exception):
    """Raised when an input references another user's category or collection."""


def normalize_url(url: str) -> str:
    """Normalize URL scheme/host/default ports and drop fragments for duplicates."""
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    hostname = (parts.hostname or "").lower()
    if ":" in hostname and not hostname.startswith("["):
        hostname = f"[{hostname}]"
    port = parts.port
    if port and not ((scheme == "http" and port == 80) or (scheme == "https" and port == 443)):
        hostname = f"{hostname}:{port}"
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((scheme, hostname, path, parts.query, ""))


def serialize_bookmark(bookmark: Bookmark) -> BookmarkRead:
    return BookmarkRead(
        id=bookmark.id,
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description,
        thumbnail=bookmark.thumbnail,
        content_type=bookmark.content_type,
        personal_note=bookmark.personal_note,
        is_favorite=bookmark.is_favorite,
        category=bookmark.category.name if bookmark.category else None,
        tag_names=[tag.name for tag in bookmark.tags],
        collection_ids=[collection.id for collection in bookmark.collections],
        created_at=bookmark.created_at,
        updated_at=bookmark.updated_at,
    )


def _owned_category(db: Session, user: User, category_id: UUID | None) -> Category | None:
    if category_id is None:
        return None
    category = db.scalar(
        select(Category).where(Category.id == category_id, Category.user_id == user.id)
    )
    if category is None:
        raise InvalidLibraryReference
    return category


def _owned_collections(db: Session, user: User, collection_ids: list[UUID]) -> list[Collection]:
    unique_ids = list(dict.fromkeys(collection_ids))
    if not unique_ids:
        return []
    collections = list(
        db.scalars(
            select(Collection).where(
                Collection.user_id == user.id,
                Collection.id.in_(unique_ids),
            )
        )
    )
    if len(collections) != len(unique_ids):
        raise InvalidLibraryReference
    by_id = {collection.id: collection for collection in collections}
    return [by_id[collection_id] for collection_id in unique_ids]


def _owned_tags(db: Session, user: User, names: list[str]) -> list[Tag]:
    normalized_names = list(dict.fromkeys(name.strip().lstrip("#") for name in names if name.strip()))
    if not normalized_names:
        return []
    existing = list(
        db.scalars(
            select(Tag).where(
                Tag.user_id == user.id,
                func.lower(Tag.name).in_([name.casefold() for name in normalized_names]),
            )
        )
    )
    by_name = {tag.name.casefold(): tag for tag in existing}
    for name in normalized_names:
        if name.casefold() not in by_name:
            tag = Tag(user_id=user.id, name=name)
            db.add(tag)
            by_name[name.casefold()] = tag
    return [by_name[name.casefold()] for name in normalized_names]


def list_bookmarks(
    db: Session,
    user: User,
    *,
    q: str | None,
    category_id: UUID | None,
    tag: str | None,
    content_type: str | None,
    favorite: bool | None,
    collection_id: UUID | None,
    sort: str,
    page: int,
    page_size: int,
) -> tuple[list[Bookmark], int]:
    statement = select(Bookmark).where(Bookmark.user_id == user.id)
    if q:
        pattern = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                Bookmark.title.ilike(pattern),
                Bookmark.description.ilike(pattern),
                Bookmark.url.ilike(pattern),
                Bookmark.personal_note.ilike(pattern),
            )
        )
    if category_id:
        statement = statement.where(Bookmark.category_id == category_id)
    if tag:
        statement = statement.where(Bookmark.tags.any(func.lower(Tag.name) == tag.casefold()))
    if content_type:
        statement = statement.where(Bookmark.content_type == content_type)
    if favorite is not None:
        statement = statement.where(Bookmark.is_favorite.is_(favorite))
    if collection_id:
        statement = statement.where(Bookmark.collections.any(Collection.id == collection_id))

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    if sort == "oldest":
        statement = statement.order_by(Bookmark.created_at.asc())
    elif sort == "title":
        statement = statement.order_by(func.lower(Bookmark.title).asc())
    elif sort == "updated":
        statement = statement.order_by(Bookmark.updated_at.desc())
    else:
        statement = statement.order_by(Bookmark.created_at.desc())
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
    return items, total


def create_bookmark(db: Session, user: User, payload: BookmarkCreate) -> Bookmark:
    url = str(payload.url)
    normalized_url = normalize_url(url)
    exists = db.scalar(
        select(Bookmark.id).where(
            Bookmark.user_id == user.id,
            Bookmark.normalized_url == normalized_url,
        )
    )
    if exists is not None:
        raise DuplicateLibraryItem

    category = _owned_category(db, user, payload.category_id)
    collections = _owned_collections(db, user, payload.collection_ids)
    tags = _owned_tags(db, user, payload.tag_names)
    bookmark = Bookmark(
        user_id=user.id,
        category=category,
        url=url,
        normalized_url=normalized_url,
        title=payload.title.strip(),
        description=payload.description,
        thumbnail=str(payload.thumbnail) if payload.thumbnail else None,
        content_type=payload.content_type,
        personal_note=payload.personal_note,
        is_favorite=payload.is_favorite,
        tags=tags,
        collections=collections,
    )
    db.add(bookmark)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateLibraryItem from exc
    db.refresh(bookmark)
    return bookmark


def get_bookmark(db: Session, user: User, bookmark_id: UUID) -> Bookmark:
    bookmark = db.scalar(
        select(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == user.id)
    )
    if bookmark is None:
        raise LibraryItemNotFound
    return bookmark


def update_bookmark(
    db: Session,
    user: User,
    bookmark_id: UUID,
    payload: BookmarkUpdate,
) -> Bookmark:
    bookmark = get_bookmark(db, user, bookmark_id)
    changes = payload.model_dump(exclude_unset=True)

    if "category_id" in changes:
        bookmark.category = _owned_category(db, user, changes.pop("category_id"))
    if "collection_ids" in changes:
        bookmark.collections = _owned_collections(db, user, changes.pop("collection_ids") or [])
    if "tag_names" in changes:
        bookmark.tags = _owned_tags(db, user, changes.pop("tag_names") or [])
    if "url" in changes:
        changes["url"] = str(changes["url"])
        bookmark.normalized_url = normalize_url(changes["url"])
    if "thumbnail" in changes:
        changes["thumbnail"] = str(changes["thumbnail"]) if changes["thumbnail"] else None
    for field, value in changes.items():
        setattr(bookmark, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateLibraryItem from exc
    db.refresh(bookmark)
    return bookmark


def delete_bookmark(db: Session, user: User, bookmark_id: UUID) -> None:
    bookmark = get_bookmark(db, user, bookmark_id)
    db.delete(bookmark)
    db.commit()


def list_categories(db: Session, user: User) -> list[Category]:
    return list(
        db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.name.asc()))
    )


def create_category(db: Session, user: User, payload: CategoryCreate) -> Category:
    category = Category(
        user_id=user.id,
        name=payload.name.strip(),
        color=payload.color,
        icon=payload.icon,
    )
    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateLibraryItem from exc
    db.refresh(category)
    return category


def list_collections(db: Session, user: User) -> list[Collection]:
    return list(
        db.scalars(
            select(Collection).where(Collection.user_id == user.id).order_by(Collection.created_at.asc())
        )
    )


def create_collection(db: Session, user: User, payload: CollectionCreate) -> Collection:
    collection = Collection(
        user_id=user.id,
        name=payload.name.strip(),
        description=payload.description,
        emoji=payload.emoji,
        color=payload.color,
    )
    db.add(collection)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateLibraryItem from exc
    db.refresh(collection)
    return collection


def category_read(category: Category) -> CategoryRead:
    return CategoryRead.model_validate(category)


def collection_read(collection: Collection) -> CollectionRead:
    return CollectionRead(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        emoji=collection.emoji,
        color=collection.color,
        bookmark_ids=[bookmark.id for bookmark in collection.bookmarks],
        created_at=collection.created_at,
    )
