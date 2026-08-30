"""Application settings loaded from environment variables / .env."""
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv()


class Settings:
    allowed_origins: list[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    data_dir: Path = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
    uploads_dir: Path = Path(os.getenv("UPLOADS_DIR", str(BASE_DIR / "uploads")))

    # MongoDB
    # 留空（或未設定）時改用記憶體 mongomock，方便本機開發與測試；
    # 正式環境請設定為實際連線字串，例如 mongodb://user:pass@host:27017
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "ccm")

    # Cloudflare R2 / Amazon S3（底圖物件儲存）
    # 全部留空時退回本機磁碟（uploads_dir），方便本機開發與測試。
    # R2 為 S3 相容，未指定 endpoint 時會依 account_id 自動推導。
    r2_account_id: str = os.getenv("R2_ACCOUNT_ID", "")
    r2_access_key_id: str = os.getenv("R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    r2_bucket_name: str = os.getenv("R2_BUCKET_NAME", "")
    r2_region: str = os.getenv("R2_REGION", "auto")
    # 例如 https://<account_id>.r2.cloudflarestorage.com（或自訂 S3 endpoint）
    r2_endpoint_url: str = os.getenv("R2_ENDPOINT_URL", "")

    max_upload_bytes: int = 5 * 1024 * 1024
    max_card_payload_bytes: int = 5 * 1024 * 1024
    max_event_template_bytes: int = 512 * 1024
    max_request_bytes: int = 10 * 1024 * 1024  # A-009: global body size limit

    # JWT auth
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_expiry_minutes: int = int(os.getenv("JWT_EXPIRY_MINUTES", "30"))
    jwt_refresh_expiry_days: int = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", "7"))

    # Initial admin account
    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "changeme")


@lru_cache
def get_settings() -> Settings:
    return Settings()
