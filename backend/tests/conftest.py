"""Shared fixtures for backend API tests.

Environment variables are configured *before* importing ``app.main`` so that
settings are picked up from temporary directories instead of real data paths.
"""

import os
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_TOKEN = "test-token"


@pytest.fixture(scope="session")
def api(tmp_path_factory):
    """TestClient wired to throwaway data/upload directories."""
    data_dir = tmp_path_factory.mktemp("data")
    uploads_dir = tmp_path_factory.mktemp("uploads")

    os.environ["API_TOKEN"] = TEST_TOKEN
    os.environ["DATA_DIR"] = str(data_dir)
    os.environ["UPLOADS_DIR"] = str(uploads_dir)
    os.environ["ALLOWED_ORIGINS"] = "*"

    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def uploads_dir():
    return Path(os.environ["UPLOADS_DIR"])


@pytest.fixture(scope="session")
def auth_headers():
    return {"x-api-token": TEST_TOKEN}
