"""Audit logging backed by MongoDB (collection: ``audit_log``).

Log entries are append-only, newest-first. Event constants match the previous
JSON implementation.
"""

from datetime import datetime, timezone
from typing import Any

from app.core.db import get_collection, strip_id

COLLECTION = "audit_log"

MAX_ENTRIES = 10000

# Event type constants
LOGIN_SUCCESS = "login_success"
LOGIN_FAILURE = "login_failure"
PASSWORD_CHANGE = "password_change"
PASSWORD_RESET = "password_reset"
USER_CREATE = "user_create"
USER_DELETE = "user_delete"
TEMPLATE_UPSERT = "template_upsert"
TEMPLATE_DELETE = "template_delete"


def log_event(
    event_type: str,
    actor: str | None = None,
    target: str | None = None,
    detail: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Append an audit log entry."""
    entry = {
        "created_ts": datetime.now(timezone.utc).timestamp(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_type,
        "actor": actor,
        "target": target,
        "detail": detail or {},
        "ip": ip_address,
    }
    get_collection(COLLECTION).insert_one(entry)


def get_logs(
    limit: int = 100,
    event_type: str | None = None,
    actor: str | None = None,
    target: str | None = None,
) -> list[dict]:
    """Query audit logs with optional filters, newest first (up to limit)."""
    query: dict = {}
    if event_type:
        query["event"] = event_type
    if actor:
        query["actor"] = actor
    if target:
        query["target"] = target

    docs = (
        get_collection(COLLECTION)
        .find(query)
        .sort("created_ts", -1)
        .limit(limit)
    )
    return [strip_id(doc) for doc in docs]
