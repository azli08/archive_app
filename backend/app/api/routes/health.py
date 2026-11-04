"""Health check endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check API health")
def health_check() -> dict[str, str]:
    """Confirm the API process is alive, without requiring database access."""
    return {"status": "ok", "service": "collectly-api"}


@router.get("/health/ready", summary="Check API and database readiness")
def readiness_check(db: Session = Depends(get_db)) -> dict[str, str]:
    """Confirm that the API can reach its configured database."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable",
        ) from exc
    return {"status": "ok", "service": "collectly-api", "database": "ok"}
