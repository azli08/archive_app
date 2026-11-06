"""Category endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.schemas.organization import CategoryCreate, CategoryRead
from app.services.library_service import DuplicateLibraryItem, category_read, create_category, list_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def read_categories(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[CategoryRead]:
    return [category_read(category) for category in list_categories(db, current_user)]


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def add_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryRead:
    try:
        return category_read(create_category(db, current_user, payload))
    except DuplicateLibraryItem as exc:
        raise HTTPException(status_code=409, detail="This category already exists") from exc
