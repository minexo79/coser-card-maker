"""POST /api/cards (JWT) and GET /api/cards/{id} (public)."""

import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError

from app.core.config import get_settings
from app.core.security import require_jwt_write
from app.services import storage

router = APIRouter(prefix="/api/cards", tags=["cards"])


class CardPayload(BaseModel):
    """Whitelist of persistable card fields; unknown fields are stripped.

    Payload mirrors the oemCardTemplates.js event entry shape — each stored
    card is a self-describing layout snapshot:
    ``{dayCount, startDate, overWriteCanvas, eventName}``.
    User-generated content (form data / image URLs) is intentionally not persisted.
    """

    dayCount: int | None = None
    startDate: str | None = None
    overWriteCanvas: dict = {}
    eventName: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_card(request: Request, token_payload: dict = Depends(require_jwt_write)) -> dict:
    body = await request.body()
    if len(body) > get_settings().max_card_payload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload too large")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    try:
        payload = CardPayload.model_validate(data)
    except ValidationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")

    username = token_payload.get("sub")
    record = storage.save_card(payload.model_dump(), created_by=username)
    return {"id": record["id"]}


@router.get("/{card_id}")
async def read_card(card_id: str) -> dict:
    record = storage.get_card(card_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return record
