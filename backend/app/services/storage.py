"""Card persistence backed by MongoDB (collection: ``cards``).

Each card is stored as a document with ``_id`` = the 12-hex card id plus the
original record shape (id / eventId / eventName / createdAt / updatedAt /
createdBy / payload).

Legacy records stored the event id in ``eventName``; ``get_card`` backfills
``eventId`` from it so readers only ever deal with the current shape.
"""

from datetime import datetime, timezone
from uuid import uuid4

from app.core.db import get_collection, strip_id

COLLECTION = "cards"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _backfill_event_id(target: dict) -> None:
    # Legacy cards have no ``eventId`` and stored the slug in ``eventName``;
    # expose it as ``eventId`` (read-time only, the document is not rewritten).
    if "eventId" not in target:
        target["eventId"] = target.get("eventName")


def save_card(payload: dict, created_by: str | None = None) -> dict:
    card_id = uuid4().hex[:12]
    now = _now_iso()
    record = {
        "id": card_id,
        "eventId": payload.get("eventId"),
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
    record = strip_id(doc)
    _backfill_event_id(record)
    if isinstance(record.get("payload"), dict):
        _backfill_event_id(record["payload"])
    return record
