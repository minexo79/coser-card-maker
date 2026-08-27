"""Audit logging service — records security-relevant events to audit_log.json.

Uses the same atomic write pattern as storage.py / event_templates.py.
Log entries are append-only (new entries are prepended to the list).
"""

import json
import os
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import get_settings

_lock = threading.Lock()

# Event type constants
LOGIN_SUCCESS = "login_success"
LOGIN_FAILURE = "login_failure"
PASSWORD_CHANGE = "password_change"
PASSWORD_RESET = "password_reset"
USER_CREATE = "user_create"
USER_DELETE = "user_delete"
TEMPLATE_UPSERT = "template_upsert"
TEMPLATE_DELETE = "template_delete"


def _audit_file() -> Path:
    return get_settings().data_dir / "audit_log.json"


def _read_log() -> list[dict]:
    path = _audit_file()
    if not path.exists():
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _write_log(entries: list[dict]) -> None:
    path = _audit_file()
    path.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def log_event(
    event_type: str,
    actor: str | None = None,
    target: str | None = None,
    detail: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Append an audit log entry.

    Args:
        event_type: One of the event type constants (LOGIN_SUCCESS, etc.)
        actor: Username performing the action (None for anonymous)
        target: Username or resource ID being acted upon
        detail: Additional structured data
        ip_address: Client IP address (optional)
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_type,
        "actor": actor,
        "target": target,
        "detail": detail or {},
        "ip": ip_address,
    }

    with _lock:
        entries = _read_log()
        entries.insert(0, entry)
        if len(entries) > 10000:
            entries = entries[:10000]
        _write_log(entries)


def get_logs(
    limit: int = 100,
    event_type: str | None = None,
    actor: str | None = None,
    target: str | None = None,
) -> list[dict]:
    """Query audit logs with optional filters."""
    with _lock:
        entries = _read_log()

    if event_type:
        entries = [e for e in entries if e["event"] == event_type]
    if actor:
        entries = [e for e in entries if e["actor"] == actor]
    if target:
        entries = [e for e in entries if e.get("target") == target]

    return entries[:limit]
