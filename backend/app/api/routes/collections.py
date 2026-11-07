"""Collection endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.organization import CollectionCreate, CollectionRead
from app.services.library_service import (
    DuplicateLibraryItem,
    LibraryItemNotFound,
    collection_read,
    create_collection,
    delete_collection,
    list_collections,
)

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=list[CollectionRead])
def read_collections(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[CollectionRead]:
    return [collection_read(item) for item in list_collections(db, current_user)]


@router.post("", response_model=CollectionRead, status_code=status.HTTP_201_CREATED)
def add_collection(
    payload: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CollectionRead:
    try:
        return collection_read(create_collection(db, current_user, payload))
    except DuplicateLibraryItem as exc:
        raise HTTPException(status_code=409, detail="This collection already exists") from exc


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_collection(
    collection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        delete_collection(db, current_user, collection_id)
    except LibraryItemNotFound as exc:
        raise HTTPException(status_code=404, detail="Collection not found") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
