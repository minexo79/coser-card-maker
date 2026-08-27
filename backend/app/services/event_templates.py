"""event_templates.json persistence with atomic writes (tmp file + os.replace).

Records keep the exact shape used by ``frontend/src/models/oemCardTemplates.js``:
``{"<eventId>": {"dayCount": int, "startDate": str, "overWriteCanvas": {...}}}``

The registry starts empty; entries are created via ``PUT /api/events/{eventId}``.
No seed data is bundled and the JSON file is only written on first upsert.
"""

import copy
import json
import os
import tempfile
import threading
from pathlib import Path

from app.core.config import get_settings

_lock = threading.Lock()


def _events_file() -> Path:
    return get_settings().data_dir / "event_templates.json"


def _read_events() -> dict:
    path = _events_file()
    if not path.exists():
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _write_events(events: dict) -> None:
    path = _events_file()
    path.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(events, f, ensure_ascii=False, indent=4)
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def list_event_templates(username: str | None = None, public_only: bool = False) -> dict:
    """List templates with createdBy-based visibility rules.

    - public_only=True (anonymous visitors) → only legacy templates (createdBy null/absent)
    - username=None, public_only=False → all templates (admin / legacy shared-token path)
    - username set → only templates where createdBy matches or is null/absent
    """
    with _lock:
        all_templates = _read_events()

    if public_only:
        return {
            eid: tmpl
            for eid, tmpl in all_templates.items()
            if tmpl.get("createdBy") is None
        }

    if username is None:
        return all_templates

    return {
        eid: tmpl
        for eid, tmpl in all_templates.items()
        if tmpl.get("createdBy") is None or tmpl.get("createdBy") == username
    }


def get_event_template(event_id: str) -> dict | None:
    with _lock:
        return _read_events().get(event_id)


def upsert_event_template(event_id: str, template: dict) -> dict:
    stored = json.loads(json.dumps(template))
    with _lock:
        events = _read_events()
        events[event_id] = stored
        _write_events(events)
    return copy.deepcopy(stored)


def delete_event_template(event_id: str) -> bool:
    with _lock:
        events = _read_events()
        if event_id not in events:
            return False
        del events[event_id]
        _write_events(events)
        return True
