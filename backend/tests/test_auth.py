"""Contract tests for /api/auth (JWT login + user management) and Phase 5
initial-admin bootstrap (``users.ensure_initial_admin``).

The session-scoped ``api`` fixture deliberately uses ADMIN_PASSWORD=changeme,
so the FastAPI startup *skips* creating the initial admin; these tests build
users through the service layer instead.
"""

import types
from datetime import datetime, timedelta, timezone

import jwt as pyjwt

from app.services import users as users_service

TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"
STRONG_PASSWORD = "S3cure!Passw0rd"


def _jwt(username: str, role: str = "user") -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    return pyjwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def _auth(username: str, role: str = "user") -> dict:
    return {"Authorization": f"Bearer {_jwt(username, role)}"}


# ---------------------------------------------------------------------------
# Phase 5 — initial admin bootstrap
# ---------------------------------------------------------------------------


def test_ensure_initial_admin_creates_admin(monkeypatch, tmp_path):
    fake = types.SimpleNamespace(
        data_dir=tmp_path,
        admin_username="boss",
        admin_password="S3cr3t!BossPass",
    )
    monkeypatch.setattr(users_service, "get_settings", lambda: fake)

    users_service.ensure_initial_admin()

    user = users_service.get_user("boss")
    assert user is not None
    assert user["role"] == "admin"


def test_ensure_initial_admin_skips_default_password(monkeypatch, tmp_path):
    """P-001: default 'changeme' must never create a live admin account."""
    fake = types.SimpleNamespace(data_dir=tmp_path, admin_username="admin", admin_password="changeme")
    monkeypatch.setattr(users_service, "get_settings", lambda: fake)

    users_service.ensure_initial_admin()

    assert users_service.get_user("admin") is None


def test_ensure_initial_admin_keeps_existing_user(monkeypatch, tmp_path):
    fake = types.SimpleNamespace(
        data_dir=tmp_path,
        admin_username="boss",
        admin_password="S3cr3t!BossPass",
    )
    monkeypatch.setattr(users_service, "get_settings", lambda: fake)
    users_service.create_user("boss", "unrelated-pass", "user")

    users_service.ensure_initial_admin()

    user = users_service.get_user("boss")
    assert user["role"] == "user"  # existing account must not be overwritten


# ---------------------------------------------------------------------------
# /api/auth endpoints
# ---------------------------------------------------------------------------


def test_login_and_me(api):
    users_service.create_user("alice", STRONG_PASSWORD, "user")

    login = api.post("/api/auth/login", json={"username": "alice", "password": STRONG_PASSWORD})
    assert login.status_code == 200
    body = login.json()
    assert body["user"]["username"] == "alice"
    assert body["user"]["role"] == "user"

    me = api.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["username"] == "alice"


def test_login_wrong_password_rejected(api):
    users_service.create_user("bob", STRONG_PASSWORD, "user")
    resp = api.post("/api/auth/login", json={"username": "bob", "password": "wrong-password"})
    assert resp.status_code == 401


def test_me_rejects_invalid_token(api):
    assert api.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401


def test_user_management_requires_admin(api):
    users_service.create_user("carol", STRONG_PASSWORD, "user")
    headers = _auth("carol", role="user")
    assert api.get("/api/auth/users", headers=headers).status_code == 403
    resp = api.post("/api/auth/users", json={"username": "x", "password": STRONG_PASSWORD}, headers=headers)
    assert resp.status_code == 403


def test_admin_can_create_and_delete_user(api):
    users_service.create_user("dana", STRONG_PASSWORD, "admin")
    headers = _auth("dana", role="admin")

    created = api.post(
        "/api/auth/users",
        json={"username": "erin", "password": "An0ther!Pass", "role": "user"},
        headers=headers,
    )
    assert created.status_code == 201
    assert created.json()["username"] == "erin"

    assert api.delete("/api/auth/users/erin", headers=headers).status_code == 200
    assert api.delete("/api/auth/users/erin", headers=headers).status_code == 404


def test_admin_cannot_delete_self(api):
    users_service.create_user("frank", STRONG_PASSWORD, "admin")
    resp = api.delete("/api/auth/users/frank", headers=_auth("frank", role="admin"))
    assert resp.status_code == 400


def test_change_password(api):
    users_service.create_user("grace", "Old!Pass123", "user")
    headers = _auth("grace", role="user")

    changed = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "Old!Pass123", "newPassword": "New!Pass456"},
        headers=headers,
    )
    assert changed.status_code == 200

    login = api.post("/api/auth/login", json={"username": "grace", "password": "New!Pass456"})
    assert login.status_code == 200


def test_create_user_requires_strong_password(api):
    users_service.create_user("heidi", STRONG_PASSWORD, "admin")
    headers = _auth("heidi", role="admin")

    weak = api.post(
        "/api/auth/users",
        json={"username": "ivy", "password": "123456", "role": "user"},
        headers=headers,
    )
    assert weak.status_code == 400