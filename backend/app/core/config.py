"""Application settings loaded from environment variables / .env."""
import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv()

class Settings():
    api_token: str = os.getenv("API_TOKEN", "dev-token")
    allowed_origins: list[str] = os.getenv("ALLOWED_ORIGINS", ["http://localhost:5173"]).split(",")
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
