"""cards.json persistence with atomic writes (tmp file + os.replace)."""

import json
import os
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.core.config import get_settings

_lock = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cards_file() -> Path:
    return get_settings().data_dir / "cards.json"


def _read_cards() -> dict:
    path = _cards_file()
    if not path.exists():
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def _write_cards(cards: dict) -> None:
    path = _cards_file()
    path.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=4)
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def save_card(payload: dict) -> dict:
    with _lock:
        card_id = uuid4().hex[:12]
        now = _now_iso()
        record = {
            "id": card_id,
            "eventName": payload.get("eventName"),
            "createdAt": now,
            "updatedAt": now,
            "payload": payload,
        }
        cards = _read_cards()
        cards[card_id] = record
        _write_cards(cards)
        return record


def get_card(card_id: str) -> dict | None:
    with _lock:
        return _read_cards().get(card_id)
