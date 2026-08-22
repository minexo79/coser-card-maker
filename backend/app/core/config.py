"""Application settings loaded from environment variables / .env."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_token: str = "dev-token"
    allowed_origins: str = "*"
    data_dir: Path = BASE_DIR / "data"
    uploads_dir: Path = BASE_DIR / "uploads"
    max_upload_bytes: int = 5 * 1024 * 1024
    max_card_payload_bytes: int = 5 * 1024 * 1024
    max_event_template_bytes: int = 512 * 1024

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
