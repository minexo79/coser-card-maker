"""users.json persistence with atomic writes (tmp file + os.replace).

Stores user accounts with bcrypt-hashed passwords. Uses the same
threading.Lock + tempfile + os.replace pattern as storage.py / event_templates.py.
"""

import json
import os
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

from app.core.config import get_settings

_lock = threading.Lock()


def _users_file() -> Path:
    return get_settings().data_dir / "users.json"


def _read_users() -> dict:
    path = _users_file()
    if not path.exists():
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _write_users(users: dict) -> None:
    path = _users_file()
    path.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=4)
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_user(username: str) -> dict | None:
    with _lock:
        return _read_users().get(username)


def verify_password(username: str, password: str) -> dict | None:
    """Return user dict if credentials match, else None."""
    with _lock:
        user = _read_users().get(username)
        if user and _check_password(password, user["password_hash"]):
            return user
    return None


def create_user(username: str, password: str, role: str = "user") -> dict:
    """Create a new user. Raises ValueError if user already exists."""
    with _lock:
        users = _read_users()
        if username in users:
            raise ValueError(f"User '{username}' already exists")
        record = {
            "username": username,
            "password_hash": _hash_password(password),
            "role": role,
            "created_at": _now_iso(),
        }
        users[username] = record
        _write_users(users)
        return record


def delete_user(username: str) -> bool:
    with _lock:
        users = _read_users()
        if username not in users:
            return False
        del users[username]
        _write_users(users)
        return True


def update_password(username: str, new_password: str) -> bool:
    """Update a user's password. Returns False if user not found."""
    with _lock:
        users = _read_users()
        if username not in users:
            return False
        users[username]["password_hash"] = _hash_password(new_password)
        _write_users(users)
        return True


def list_users() -> list[dict]:
    """Return all users without password_hash."""
    with _lock:
        users = _read_users()
    return [
        {
            "username": u["username"],
            "role": u["role"],
            "created_at": u["created_at"],
        }
        for u in users.values()
    ]


def user_exists(username: str) -> bool:
    with _lock:
        return username in _read_users()


def ensure_initial_admin() -> None:
    """Create the initial admin account from env vars if it doesn't exist.

    Skips if ADMIN_PASSWORD is still the default 'changeme' value (P-001).
    """
    settings = get_settings()
    username = settings.admin_username
    password = settings.admin_password

    if not username or not password:
        return

    if password == "changeme":
        print(f"[startup] WARNING: ADMIN_PASSWORD is still 'changeme'. Skipping admin account creation. Please set a strong password.")
        return

    with _lock:
        users = _read_users()
        if username not in users:
            record = {
                "username": username,
                "password_hash": _hash_password(password),
                "role": "admin",
                "created_at": _now_iso(),
            }
            users[username] = record
            _write_users(users)
            print(f"[startup] Created initial admin account: {username}")
