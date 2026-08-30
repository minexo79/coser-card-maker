"""MongoDB connectivity (replaces the JSON-file persistence services).

When ``MONGODB_URI`` is set the app connects to a real MongoDB. When it is
empty (local development / tests) an in-memory ``mongomock`` client is used so
the backend runs without a running server.
"""

from functools import lru_cache

try:
    from pymongo import MongoClient as _PyMongoClient
except ImportError:  # pragma: no cover - pymongo is a hard dependency
    _PyMongoClient = None

try:
    import mongomock
except ImportError:  # pragma: no cover - optional for local dev / tests
    mongomock = None


def _build_client(uri: str):
    if uri:
        return _PyMongoClient(uri, serverSelectionTimeoutMS=3000)
    if mongomock is not None:
        return mongomock.MongoClient()
    raise RuntimeError("MONGODB_URI is not set and mongomock is unavailable")


@lru_cache
def get_db():
    from app.core.config import get_settings

    settings = get_settings()
    client = _build_client(settings.mongodb_uri)
    return client[settings.mongodb_db_name]


def get_collection(name: str):
    return get_db()[name]


def strip_id(doc: dict) -> dict:
    """Return a copy of a document with the Mongo ``_id`` field removed."""
    doc = dict(doc)
    doc.pop("_id", None)
    return doc
