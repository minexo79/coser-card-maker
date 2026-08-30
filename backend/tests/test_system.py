"""Contract tests for GET /api/admin/system-status.

The endpoint is admin-only: unauthenticated → 401, non-admin → 403, admin → 200
with frontend/backend versions and a safe environment subset.
"""

from datetime import datetime, timedelta, timezone

import jwt as pyjwt

from app.services import users as users_service

TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"
STRONG_PASSWORD = "S3cure!Passw0rd"


def _jwt(username: str, role: str = "user") -> str:
    payload = {
        "sub": username,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def _auth(username: str, role: str = "user") -> dict:
    return {"Authorization": f"Bearer {_jwt(username, role)}"}


def test_system_status_requires_auth(api):
    resp = api.get("/api/admin/system-status")
    assert resp.status_code == 401


def test_system_status_requires_admin(api):
    users_service.create_user("sys_user", STRONG_PASSWORD, "user")
    resp = api.get("/api/admin/system-status", headers=_auth("sys_user", "user"))
    assert resp.status_code == 403


def test_system_status_admin_ok(api):
    users_service.create_user("sys_admin", STRONG_PASSWORD, "admin")
    resp = api.get(
        "/api/admin/system-status",
        headers={**_auth("sys_admin", "admin"), "X-Frontend-Version": "9.9.9", "X-Node-Version": "22.14.0"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["backendVersion"]
    assert body["frontendVersion"] == "9.9.9"
    assert body["backendPythonVersion"]
    assert body["frontendNodeVersion"] == "22.14.0"
    assert isinstance(body["environment"], dict)
    assert len(body["environment"]) > 0


def test_system_status_does_not_expose_secrets(api):
    users_service.create_user("sys_admin2", STRONG_PASSWORD, "admin")
    resp = api.get("/api/admin/system-status", headers=_auth("sys_admin2", "admin"))
    assert resp.status_code == 200
    body = resp.json()
    secrets = ["JWT_SECRET", "ADMIN_PASSWORD", "password_hash"]
    serialized = str(body["environment"])
    for key in secrets:
        assert key not in serialized
