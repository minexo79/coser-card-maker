"""Contract tests for /api/auth (JWT login + user management) and Phase 5
initial-admin bootstrap (``users.ensure_initial_admin``).

The session-scoped ``api`` fixture deliberately uses ADMIN_PASSWORD=changeme,
so the FastAPI startup *skips* creating the initial admin; these tests build
users through the service layer instead.
"""

import types
from datetime import datetime, timedelta, timezone

import jwt as pyjwt

from app.core.db import get_collection
from app.services import users as users_service

TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"
STRONG_PASSWORD = "S3cure!Passw0rd"


def _reset_users() -> None:
    """Clear the shared users collection for isolated bootstrap tests."""
    get_collection("users").delete_many({})


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


# ---------------------------------------------------------------------------
# Phase 5 — initial admin bootstrap
# ---------------------------------------------------------------------------


def test_ensure_initial_admin_creates_admin(monkeypatch):
    _reset_users()
    fake = types.SimpleNamespace(
        admin_username="boss",
        admin_password="S3cr3t!BossPass",
    )
    monkeypatch.setattr(users_service, "get_settings", lambda: fake)

    users_service.ensure_initial_admin()

    user = users_service.get_user("boss")
    assert user is not None
    assert user["role"] == "admin"


def test_ensure_initial_admin_skips_default_password(monkeypatch):
    """P-001: default 'changeme' must never create a live admin account."""
    _reset_users()
    fake = types.SimpleNamespace(admin_username="admin", admin_password="changeme")
    monkeypatch.setattr(users_service, "get_settings", lambda: fake)

    users_service.ensure_initial_admin()

    assert users_service.get_user("admin") is None


def test_ensure_initial_admin_keeps_existing_user(monkeypatch):
    _reset_users()
    fake = types.SimpleNamespace(
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


# ---------------------------------------------------------------------------
# Feature 2 — Password strength policy
# ---------------------------------------------------------------------------


def test_password_requires_uppercase(api):
    users_service.create_user("pw_upper", "lowercase!1", "user")
    headers = _auth("pw_upper", "user")
    resp = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "lowercase!1", "newPassword": "alllowercase!1"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "大寫" in resp.json()["detail"]


def test_password_requires_lowercase(api):
    users_service.create_user("pw_lower", "ALLUPPER!1", "user")
    headers = _auth("pw_lower", "user")
    resp = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "ALLUPPER!1", "newPassword": "ALLUPPERCASE!1"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "小寫" in resp.json()["detail"]


def test_password_requires_digit(api):
    users_service.create_user("pw_digit", "NoDigits!a", "user")
    headers = _auth("pw_digit", "user")
    resp = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "NoDigits!a", "newPassword": "NoDigitsEither!a"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "數字" in resp.json()["detail"]


def test_password_requires_special_char(api):
    users_service.create_user("pw_special", "NoSpecial1a", "user")
    headers = _auth("pw_special", "user")
    resp = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "NoSpecial1a", "newPassword": "NoSpecialEither1a"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "特殊字元" in resp.json()["detail"]


def test_password_cannot_match_username(api):
    # Use a username that itself meets password complexity requirements
    users_service.create_user("Pw_Match1!", "Old!Pass123", "user")
    headers = _auth("Pw_Match1!", "user")
    resp = api.post(
        "/api/auth/change-password",
        json={"oldPassword": "Old!Pass123", "newPassword": "Pw_Match1!"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "使用者名稱" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Feature 3 — Token Refresh
# ---------------------------------------------------------------------------


def test_login_sets_refresh_cookie(api):
    users_service.create_user("refresh_user", STRONG_PASSWORD, "user")
    resp = api.post("/api/auth/login", json={
        "username": "refresh_user", "password": STRONG_PASSWORD
    })
    assert resp.status_code == 200
    assert "refresh_token" in resp.cookies


def test_refresh_token_issues_new_access(api):
    users_service.create_user("refresh_user2", STRONG_PASSWORD, "user")
    login = api.post("/api/auth/login", json={
        "username": "refresh_user2", "password": STRONG_PASSWORD
    })
    refresh_cookie = login.cookies.get("refresh_token")
    resp = api.post("/api/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_refresh_without_cookie_returns_401(api):
    resp = api.post("/api/auth/refresh")
    assert resp.status_code == 401


def test_logout_clears_refresh_cookie(api):
    resp = api.post("/api/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ---------------------------------------------------------------------------
# Feature 5 — Audit logging
# ---------------------------------------------------------------------------


def test_login_failure_logged(api):
    users_service.create_user("log_test", STRONG_PASSWORD, "user")
    api.post("/api/auth/login", json={"username": "log_test", "password": "wrong"})
    from app.services.audit import get_logs, LOGIN_FAILURE
    logs = get_logs(event_type=LOGIN_FAILURE, actor="log_test")
    assert len(logs) >= 1
    assert logs[0]["event"] == LOGIN_FAILURE


def test_password_change_logged(api):
    users_service.create_user("pw_log", "Old!Pass123", "user")
    headers = _auth("pw_log", "user")
    api.post("/api/auth/change-password", json={
        "oldPassword": "Old!Pass123", "newPassword": "New!Pass456"
    }, headers=headers)
    from app.services.audit import get_logs, PASSWORD_CHANGE
    logs = get_logs(event_type=PASSWORD_CHANGE, actor="pw_log")
    assert len(logs) >= 1


def test_admin_reset_password_logged(api):
    users_service.create_user("admin_log", STRONG_PASSWORD, "admin")
    users_service.create_user("target_user", "Old!Pass123", "user")
    headers = _auth("admin_log", "admin")
    api.put("/api/auth/users/target_user/password", json={
        "newPassword": "Reset!Pass123"
    }, headers=headers)
    from app.services.audit import get_logs, PASSWORD_RESET
    logs = get_logs(event_type=PASSWORD_RESET, target="target_user")
    assert len(logs) >= 1
    assert logs[0]["actor"] == "admin_log"


def test_audit_logs_requires_admin(api):
    users_service.create_user("regular", STRONG_PASSWORD, "user")
    headers = _auth("regular", "user")
    resp = api.get("/api/auth/audit-logs", headers=headers)
    assert resp.status_code == 403