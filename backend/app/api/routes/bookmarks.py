"""Bookmark CRUD and search endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.organization import BookmarkCreate, BookmarkPage, BookmarkRead, BookmarkUpdate
from app.services.library_service import (
    DuplicateLibraryItem,
    InvalidLibraryReference,
    LibraryItemNotFound,
    create_bookmark,
    delete_bookmark,
    get_bookmark,
    list_bookmarks,
    serialize_bookmark,
    update_bookmark,
)

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=BookmarkPage, summary="List the current user's bookmarks")
def read_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: str | None = None,
    category_id: UUID | None = None,
    tag: str | None = None,
    content_type: str | None = None,
    favorite: bool | None = None,
    collection_id: UUID | None = None,
    sort: str = Query(default="newest", pattern="^(newest|oldest|title|updated)$"),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 100,
) -> BookmarkPage:
    items, total = list_bookmarks(
        db,
        current_user,
        q=q,
        category_id=category_id,
        tag=tag,
        content_type=content_type,
        favorite=favorite,
        collection_id=collection_id,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return BookmarkPage(
        items=[serialize_bookmark(bookmark) for bookmark in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
def add_bookmark(
    payload: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookmarkRead:
    try:
        return serialize_bookmark(create_bookmark(db, current_user, payload))
    except DuplicateLibraryItem as exc:
        raise HTTPException(status_code=409, detail="This URL is already saved") from exc
    except InvalidLibraryReference as exc:
        raise HTTPException(status_code=422, detail="Category or collection is invalid") from exc


@router.get("/{bookmark_id}", response_model=BookmarkRead)
def read_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookmarkRead:
    try:
        return serialize_bookmark(get_bookmark(db, current_user, bookmark_id))
    except LibraryItemNotFound as exc:
        raise HTTPException(status_code=404, detail="Bookmark not found") from exc


@router.patch("/{bookmark_id}", response_model=BookmarkRead)
def edit_bookmark(
    bookmark_id: UUID,
    payload: BookmarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookmarkRead:
    try:
        return serialize_bookmark(update_bookmark(db, current_user, bookmark_id, payload))
    except LibraryItemNotFound as exc:
        raise HTTPException(status_code=404, detail="Bookmark not found") from exc
    except DuplicateLibraryItem as exc:
        raise HTTPException(status_code=409, detail="This URL is already saved") from exc
    except InvalidLibraryReference as exc:
        raise HTTPException(status_code=422, detail="Category or collection is invalid") from exc


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        delete_bookmark(db, current_user, bookmark_id)
    except LibraryItemNotFound as exc:
        raise HTTPException(status_code=404, detail="Bookmark not found") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
