"""User persistence backed by MongoDB (collection: ``users``).

Stores user accounts with bcrypt-hashed passwords. ``_id`` = username.
"""

from datetime import datetime, timezone

import bcrypt

from app.core.config import get_settings
from app.core.db import get_collection, strip_id

COLLECTION = "users"


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_user(username: str) -> dict | None:
    doc = get_collection(COLLECTION).find_one({"_id": username})
    if doc is None:
        return None
    return strip_id(doc)


def verify_password(username: str, password: str) -> dict | None:
    """Return user dict if credentials match, else None."""
    user = get_user(username)
    if user and _check_password(password, user["password_hash"]):
        return user
    return None


def create_user(username: str, password: str, role: str = "user") -> dict:
    """Create a new user. Raises ValueError if user already exists."""
    collection = get_collection(COLLECTION)
    if collection.find_one({"_id": username}) is not None:
        raise ValueError(f"User '{username}' already exists")
    record = {
        "username": username,
        "password_hash": _hash_password(password),
        "role": role,
        "created_at": _now_iso(),
    }
    collection.insert_one({"_id": username, **record})
    return record


def delete_user(username: str) -> bool:
    result = get_collection(COLLECTION).delete_one({"_id": username})
    return result.deleted_count > 0


def update_password(username: str, new_password: str) -> bool:
    """Update a user's password. Returns False if user not found."""
    result = get_collection(COLLECTION).update_one(
        {"_id": username},
        {"$set": {"password_hash": _hash_password(new_password)}},
    )
    return result.matched_count > 0


def list_users() -> list[dict]:
    """Return all users without password_hash."""
    users = []
    for doc in get_collection(COLLECTION).find(
        {}, {"_id": 0, "username": 1, "role": 1, "created_at": 1}
    ):
        users.append(dict(doc))
    return users


def user_exists(username: str) -> bool:
    return get_collection(COLLECTION).find_one({"_id": username}) is not None


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

    collection = get_collection(COLLECTION)
    if collection.find_one({"_id": username}) is not None:
        return

    record = {
        "username": username,
        "password_hash": _hash_password(password),
        "role": "admin",
        "created_at": _now_iso(),
    }
    collection.insert_one({"_id": username, **record})
    print(f"[startup] Created initial admin account: {username}")
