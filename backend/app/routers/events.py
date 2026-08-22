"""/api/events — per-event card templates.

Stored/returned records use the exact same shape as
``frontend/src/models/oemCardTemplates.js`` entries:
``{"dayCount": int, "startDate": str, "overWriteCanvas": {...}}``
GET is public; PUT/DELETE require the shared API token.
"""

import json
import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, ValidationError

from app.core.config import get_settings
from app.core.security import require_token
from app.services import event_templates

router = APIRouter(prefix="/api/events", tags=["events"])

Coordinate = int | float


class _ExtraAllowed(BaseModel):
    # Keep unknown keys so newer frontends can add layout fields without a backend release.
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
    fontFamily: str
    nickname: BoxConfig
    category: BoxConfig | None = None
    message: BoxConfig


class OverWriteCanvasConfig(_ExtraAllowed):
    baseImagePath: str | None = None
    fontColor: str | None = None
    canvas: CanvasConfig
    upload: UploadConfig | None = None
    imageSlots: list[ImageSlotConfig]
    titleImage: BoxConfig | None = None
    textPositions: TextPositionsConfig
    categorySelection: dict[str, BoxConfig] | None = None


class EventTemplatePayload(_ExtraAllowed):
    dayCount: int
    startDate: date
    overWriteCanvas: OverWriteCanvasConfig


_EVENT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def _validate_event_id(event_id: str) -> str:
    if not _EVENT_ID_PATTERN.fullmatch(event_id or ""):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid event id")
    return event_id


@router.get("")
async def read_event_templates() -> dict:
    return event_templates.list_event_templates()


@router.get("/{event_id}")
async def read_event_template(event_id: str) -> dict:
    _validate_event_id(event_id)
    template = event_templates.get_event_template(event_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event template not found")
    return template


@router.put("/{event_id}", dependencies=[Depends(require_token)])
async def upsert_event_template(event_id: str, request: Request) -> dict:
    _validate_event_id(event_id)

    body = await request.body()
    if len(body) > get_settings().max_event_template_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload too large")

    try:
        data = json.loads(body)
        template = EventTemplatePayload.model_validate(data)
    except (json.JSONDecodeError, ValidationError):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid event template")

    # exclude_none keeps the stored JSON identical in shape to the submitted
    # oemCardTemplates.js entry (unset optional boxes are simply absent).
    return event_templates.upsert_event_template(event_id, template.model_dump(mode="json", exclude_none=True))


@router.delete("/{event_id}", dependencies=[Depends(require_token)], status_code=status.HTTP_204_NO_CONTENT)
async def remove_event_template(event_id: str) -> None:
    _validate_event_id(event_id)
    if not event_templates.delete_event_template(event_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event template not found")
