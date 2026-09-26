"""Event template persistence backed by MongoDB (collection: ``event_templates``).

Each document is one event template with ``_id`` = event id and a body of
``{"name", "dayCount", "startDate", "overWriteCanvas", "createdBy"}``.

``name`` is the display name. Legacy documents without one are returned with
``name`` set to the event id, so callers never need their own fallback.
"""

import copy

from app.core.db import get_collection, strip_id

COLLECTION = "event_templates"
EVENT_NAME_MAX_LENGTH = 100


def _with_name(event_id: str, doc: dict) -> dict:
    """Strip ``_id`` and guarantee a ``name`` (legacy docs fall back to the id).

    Read-time fallback only — the database is never rewritten, so no migration
    is required for templates created before ``name`` existed.
    """
    result = strip_id(doc)
    if not result.get("name"):
        result["name"] = event_id
    return result


def list_event_templates(username: str | None = None, public_only: bool = False) -> dict:
    """List templates with createdBy-based visibility rules.

    - public_only=True (anonymous visitors) → only legacy templates (createdBy null/absent)
    - username=None, public_only=False → all templates (admin / legacy shared-token path)
    - username set → only templates where createdBy matches or is null/absent
    """
    query: dict = {}
    if public_only:
        query["createdBy"] = None
    elif username is not None:
        query = {"$or": [{"createdBy": None}, {"createdBy": username}]}

    result = {}
    for doc in get_collection(COLLECTION).find(query):
        event_id = doc["_id"]
        result[event_id] = _with_name(event_id, doc)
    return result


def list_event_summaries() -> list[dict]:
    """Lightweight ``[{"id", "name"}]`` listing sorted by start date."""
    # Projection keeps the large ``overWriteCanvas`` out of this hot endpoint.
    docs = get_collection(COLLECTION).find({}, {"name": 1, "startDate": 1})
    docs = sorted(docs, key=lambda doc: str(doc.get("startDate") or ""))
    return [{"id": doc["_id"], "name": doc.get("name") or doc["_id"]} for doc in docs]


def get_event_template(event_id: str) -> dict | None:
    doc = get_collection(COLLECTION).find_one({"_id": event_id})
    if doc is None:
        return None
    return _with_name(event_id, doc)


def get_event_name(event_id: str) -> str | None:
    """Display name of an event, or None when the event does not exist."""
    doc = get_collection(COLLECTION).find_one({"_id": event_id}, {"name": 1})
    if doc is None:
        return None
    return doc.get("name") or event_id


def upsert_event_template(event_id: str, template: dict) -> dict:
    stored = copy.deepcopy(template)
    get_collection(COLLECTION).replace_one(
        {"_id": event_id},
        {"_id": event_id, **stored},
        upsert=True,
    )
    return _with_name(event_id, stored)


def delete_event_template(event_id: str) -> bool:
    result = get_collection(COLLECTION).delete_one({"_id": event_id})
    return result.deleted_count > 0
