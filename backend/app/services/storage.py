"""Card persistence backed by MongoDB (collection: ``cards``).

Each card is stored as a document with ``_id`` = the 12-hex card id plus the
original record shape (id / eventName / createdAt / updatedAt / createdBy /
payload).
"""

from datetime import datetime, timezone
from uuid import uuid4

from app.core.db import get_collection, strip_id

COLLECTION = "cards"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def save_card(payload: dict, created_by: str | None = None) -> dict:
    card_id = uuid4().hex[:12]
    now = _now_iso()
    record = {
        "id": card_id,
        "eventName": payload.get("eventName"),
        "createdAt": now,
        "updatedAt": now,
        "payload": payload,
    }
    if created_by:
        record["createdBy"] = created_by
    get_collection(COLLECTION).insert_one({"_id": card_id, **record})
    return record


def get_card(card_id: str) -> dict | None:
    doc = get_collection(COLLECTION).find_one({"_id": card_id})
    if doc is None:
        return None
    return strip_id(doc)
