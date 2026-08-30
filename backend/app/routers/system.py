"""GET /api/admin/system-status — admin-only system status.

Returns the current backend version and Python runtime, the frontend version and
Node.js runtime (echoed from the ``X-Frontend-Version`` / ``X-Node-Version``
headers the SPA sends), and a safe subset of the running environment
configuration. Secrets (JWT_SECRET, ADMIN_PASSWORD, raw MongoDB credentials)
are never exposed.
"""

import platform
import re

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.config import get_settings
from app.core.security import require_jwt_write

BACKEND_VERSION = "1.0.0"
BACKEND_PYTHON_VERSION = platform.python_version()

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _mask_mongodb_uri(uri: str) -> str:
    """Redact the password portion of a MongoDB connection string."""
    if not uri:
        return ""
    # mongodb://user:pass@host  →  mongodb://user:****@host
    return re.sub(r"(?<=://)[^:@/]+:[^@/]+@", lambda m: m.group(0).split(":", 1)[0] + ":****@", uri)


def _safe_environment() -> dict:
    settings = get_settings()
    return {
        "ALLOWED_ORIGINS": ",".join(settings.allowed_origins),
        "DATA_DIR": str(settings.data_dir),
        "UPLOADS_DIR": str(settings.uploads_dir),
        "MONGODB_DB_NAME": settings.mongodb_db_name,
        "MONGODB_URI": _mask_mongodb_uri(settings.mongodb_uri),
        "MONGODB_CONFIGURED": "true" if settings.mongodb_uri else "false",
        "ADMIN_USERNAME": settings.admin_username,
        "JWT_EXPIRY_MINUTES": str(settings.jwt_expiry_minutes),
        "JWT_REFRESH_EXPIRY_DAYS": str(settings.jwt_refresh_expiry_days),
        "MAX_UPLOAD_BYTES": str(settings.max_upload_bytes),
        "MAX_CARD_PAYLOAD_BYTES": str(settings.max_card_payload_bytes),
        "MAX_EVENT_TEMPLATE_BYTES": str(settings.max_event_template_bytes),
        "MAX_REQUEST_BYTES": str(settings.max_request_bytes),
        "R2_ACCOUNT_ID": str(settings.r2_account_id),
        "R2_ACCESS_KEY_ID": str(settings.r2_access_key_id),
        "R2_SECRET_ACCESS_KEY": str(settings.r2_secret_access_key),
        "R2_BUCKET_NAME": str(settings.r2_bucket_name),
        "R2_REGION": str(settings.r2_region),
        "R2_ENDPOINT_URL": str(settings.r2_endpoint_url)
    }


@router.get("/system-status")
async def system_status(
    token_payload: dict = Depends(require_jwt_write),
    x_frontend_version: str | None = Header(default=None, alias="X-Frontend-Version"),
    x_node_version: str | None = Header(default=None, alias="X-Node-Version"),
) -> dict:
    if token_payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return {
        "frontendVersion": x_frontend_version or "unknown",
        "backendVersion": BACKEND_VERSION,
        "frontendNodeVersion": x_node_version or "unknown",
        "backendPythonVersion": BACKEND_PYTHON_VERSION,
        "environment": _safe_environment(),
    }
