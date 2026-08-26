"""Application settings loaded from environment variables / .env."""
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv()


class Settings:
    api_token: str = os.getenv("API_TOKEN", "dev-token")
    allowed_origins: list[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    data_dir: Path = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
    uploads_dir: Path = Path(os.getenv("UPLOADS_DIR", str(BASE_DIR / "uploads")))
    max_upload_bytes: int = 5 * 1024 * 1024
    max_card_payload_bytes: int = 5 * 1024 * 1024
    max_event_template_bytes: int = 512 * 1024
    max_request_bytes: int = 10 * 1024 * 1024  # A-009: global body size limit

    # JWT auth
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_expiry_minutes: int = int(os.getenv("JWT_EXPIRY_MINUTES", "30"))

    # Initial admin account
    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "changeme")


@lru_cache
def get_settings() -> Settings:
    return Settings()
