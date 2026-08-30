"""Event template persistence backed by MongoDB (collection: ``event_templates``).

Each document is one event template with ``_id`` = event id and a body of
``{"dayCount", "startDate", "overWriteCanvas", "createdBy"}``.
"""

import copy

from app.core.db import get_collection, strip_id

COLLECTION = "event_templates"


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
        result[event_id] = strip_id(doc)
    return result


def get_event_template(event_id: str) -> dict | None:
    doc = get_collection(COLLECTION).find_one({"_id": event_id})
    if doc is None:
        return None
    return strip_id(doc)


def upsert_event_template(event_id: str, template: dict) -> dict:
    stored = copy.deepcopy(template)
    get_collection(COLLECTION).replace_one(
        {"_id": event_id},
        {"_id": event_id, **stored},
        upsert=True,
    )
    return stored


def delete_event_template(event_id: str) -> bool:
    result = get_collection(COLLECTION).delete_one({"_id": event_id})
    return result.deleted_count > 0
