"""Collection endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.organization import CollectionCreate, CollectionRead
from app.services.library_service import (
    DuplicateLibraryItem,
    collection_read,
    create_collection,
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
