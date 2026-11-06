"""Application settings loaded from environment variables."""

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the Collectly API."""

    app_name: str = "Collectly API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://collectly:collectly@localhost:5433/collectly"
    jwt_secret_key: SecretStr = SecretStr("development-only-secret-change-before-deploy")
    jwt_access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def require_secure_production_secret(self) -> "Settings":
        """Prevent the development fallback key from being used in production."""
        if self.environment.casefold() in {"production", "prod"}:
            secret = self.jwt_secret_key.get_secret_value()
            unsafe_markers = ("change-before-deploy", "replace-with", "development-only")
            if len(secret) < 32 or any(marker in secret.casefold() for marker in unsafe_markers):
                raise ValueError("Set a unique JWT_SECRET_KEY with at least 32 characters in production")
        return self


settings = Settings()
