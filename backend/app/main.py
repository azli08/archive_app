"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.bookmarks import router as bookmarks_router
from app.api.routes.categories import router as categories_router
from app.api.routes.collections import router as collections_router
from app.api.routes.health import router as health_router
from app.api.routes.users import router as users_router
from app.config import settings

app = FastAPI(title=settings.app_name)


@app.get("/", tags=["health"], summary="Show API service information")
def root() -> dict[str, str]:
    """Provide a useful response at the service's base URL."""
    return {
        "service": "collectly-api",
        "status": "ok",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
        "readiness": f"{settings.api_v1_prefix}/health/ready",
    }


allowed_origins = list(dict.fromkeys([*settings.cors_origins, "https://localhost"]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(bookmarks_router, prefix=settings.api_v1_prefix)
app.include_router(categories_router, prefix=settings.api_v1_prefix)
app.include_router(collections_router, prefix=settings.api_v1_prefix)
