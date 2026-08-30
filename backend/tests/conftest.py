"""Shared fixtures for backend API tests.

Test-only environment variables are configured at *module import time* —
before any ``app.*`` module can be imported during test collection — because
``app.core.config.Settings`` reads its values from the environment at class
definition time (e.g. ``jwt_secret = os.getenv(...)`` is evaluated when the
class is created, not per call). ``load_dotenv()`` also refuses to override
keys that already exist in the environment.
"""

import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt as pyjwt
import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"

_TEST_ROOT = Path(tempfile.mkdtemp(prefix="ccm-pytest-data-"))

os.environ["ALLOWED_ORIGINS"] = "*"
os.environ["JWT_SECRET"] = TEST_JWT_SECRET
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "changeme"  # skipped by startup (P-001)
os.environ["DATA_DIR"] = str(_TEST_ROOT / "data")
os.environ["UPLOADS_DIR"] = str(_TEST_ROOT / "uploads")
# Tests always run against an in-memory mongomock DB, never a real MongoDB,
# so the suite is isolated from any configured MONGODB_URI in .env.
os.environ["MONGODB_URI"] = ""
os.environ["MONGODB_DB_NAME"] = "ccm_test"
# Tests always use local-disk fallback for uploaded files; never a real R2/S3
# bucket, so the suite is isolated from any configured R2_* in .env.
os.environ["R2_ACCOUNT_ID"] = ""
os.environ["R2_ACCESS_KEY_ID"] = ""
os.environ["R2_SECRET_ACCESS_KEY"] = ""
os.environ["R2_BUCKET_NAME"] = ""
os.environ["R2_ENDPOINT_URL"] = ""


def _create_test_jwt(username: str, role: str = "user") -> str:
    payload = {
        "sub": username,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="session")
def api():
    """TestClient wired to throwaway data/upload directories."""
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def uploads_dir() -> Path:
    return Path(os.environ["UPLOADS_DIR"])


@pytest.fixture(scope="session")
def auth_headers():
    """JWT-based auth headers for write operations."""
    return {"Authorization": f"Bearer {_create_test_jwt('admin', 'admin')}"}