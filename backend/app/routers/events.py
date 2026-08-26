"""/api/events — per-event card templates.

Stored/returned records use the exact same shape as
``frontend/src/models/oemCardTemplates.js`` entries:
``{"dayCount": int, "startDate": str, "overWriteCanvas": {...}}``
GET is public; PUT/DELETE require the shared API token.
"""

import json
import re
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, ValidationError

from app.core.config import get_settings
from app.core.security import require_token
from app.services import event_templates
from app.services.users import get_user

router = APIRouter(prefix="/api/events", tags=["events"])

Coordinate = int | float


class _ExtraAllowed(BaseModel):
    model_config = ConfigDict(extra="allow")


class CanvasConfig(_ExtraAllowed):
    width: Coordinate
    height: Coordinate
    downloadWidth: Coordinate | None = None
    downloadHeight: Coordinate | None = None


class UploadConfig(_ExtraAllowed):
    maxFileSizeBytes: int


class DateRoleConfig(_ExtraAllowed):
    fontSize: Coordinate
    x: Coordinate
    y: Coordinate
    width: Coordinate
    height: Coordinate


class ImageSlotConfig(_ExtraAllowed):
    key: str
    label: str = ""
    x: Coordinate
    y: Coordinate
    width: Coordinate
    height: Coordinate
    radius: Coordinate | None = None
    dateRole: DateRoleConfig | None = None


class BoxConfig(_ExtraAllowed):
    x: Coordinate
    y: Coordinate
    width: Coordinate
    height: Coordinate
    fontSize: Coordinate | None = None
    lineHeight: Coordinate | None = None


class TextPositionsConfig(_ExtraAllowed):
    fontFamily: str = ""
    nickname: BoxConfig | None = None
    category: BoxConfig | None = None
    message: BoxConfig | None = None


class OverWriteCanvasConfig(_ExtraAllowed):
    baseImagePath: str | None = None
    fontColor: str | None = None
    canvas: CanvasConfig
    upload: UploadConfig | None = None
    imageSlots: list[ImageSlotConfig] = []
    titleImage: BoxConfig | None = None
    textPositions: TextPositionsConfig | None = None
    categorySelection: dict[str, BoxConfig] | None = None


class EventTemplatePayload(BaseModel):
    """Main template payload — uses extra='ignore' for safe storage (A-006)."""
    model_config = ConfigDict(extra="ignore")

    dayCount: int
    startDate: date
    overWriteCanvas: OverWriteCanvasConfig
    createdBy: str | None = None


def _strip_unknown_fields(data: dict) -> dict:
    """A-006: Strip unknown fields from top-level payload only.

    Nested models (overWriteCanvas, etc.) keep extra='allow' for forward
    compatibility — newer frontends may add layout fields without a backend release.
    """
    validated = EventTemplatePayload.model_validate(data)
    return validated.model_dump(mode="json", exclude_none=True)


_EVENT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def _validate_event_id(event_id: str) -> str:
    if not _EVENT_ID_PATTERN.fullmatch(event_id or ""):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid event id")
    return event_id


def _parse_jwt_user(request: Request) -> tuple[str | None, str | None]:
    """Extract username and role from JWT Bearer token. Returns (username, role) or (None, None)."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None

    token = auth_header[7:]
    try:
        import jwt as pyjwt
        payload = pyjwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        return payload.get("sub"), payload.get("role")
    except Exception:
        return None, None


# --- A-011: GET /api/events with user filtering ---

@router.get("")
async def read_event_templates(
    request: Request,
    username: str | None = Query(default=None),
) -> dict:
    jwt_username, jwt_role = _parse_jwt_user(request)

    # Admin sees everything; non-admin sees only their own + null createdBy
    if jwt_role == "admin":
        return event_templates.list_event_templates()

    # Explicit ?username= query param (non-admin users only see their own)
    effective_user = username if username else jwt_username
    return event_templates.list_event_templates(username=effective_user)


# --- GET /api/events/mine (auto-filter from JWT) ---

@router.get("/mine")
async def read_my_event_templates(request: Request) -> dict:
    jwt_username, jwt_role = _parse_jwt_user(request)
    if jwt_role == "admin":
        return event_templates.list_event_templates()
    if not jwt_username:
        raise HTTPException(status_code=401, detail="Authentication required")
    return event_templates.list_event_templates(username=jwt_username)


# --- GET /api/events/{id} (public read) ---

@router.get("/{event_id}")
async def read_event_template(event_id: str) -> dict:
    _validate_event_id(event_id)
    template = event_templates.get_event_template(event_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event template not found")

    return template


# --- PUT with createdBy auto-write ---

@router.put("/{event_id}", dependencies=[Depends(require_token)])
async def upsert_event_template(event_id: str, request: Request) -> dict:
    _validate_event_id(event_id)

    body = await request.body()
    if len(body) > get_settings().max_event_template_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload too large")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid JSON")

    # A-006: strip unknown fields and validate before storage
    try:
        cleaned = _strip_unknown_fields(data)
    except ValidationError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid event template")

    # Auto-write createdBy from JWT
    jwt_username, jwt_role = _parse_jwt_user(request)
    existing_created_by = data.get("createdBy")
    if jwt_username:
        # Admin editing others' templates keeps original createdBy
        if jwt_role == "admin" and existing_created_by and existing_created_by != jwt_username:
            cleaned["createdBy"] = existing_created_by
        else:
            cleaned["createdBy"] = jwt_username

    return event_templates.upsert_event_template(event_id, cleaned)


@router.delete("/{event_id}", dependencies=[Depends(require_token)], status_code=status.HTTP_204_NO_CONTENT)
async def remove_event_template(event_id: str) -> None:
    _validate_event_id(event_id)
    if not event_templates.delete_event_template(event_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event template not found")
