"""POST /api/uploads — token-protected image upload with server-side filenames."""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.core.security import require_token

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

CONTENT_TYPE_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg"
}


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _: None = Depends(require_token),
) -> dict:
    settings = get_settings()

    ext = CONTENT_TYPE_EXT.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported media type")

    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.uploads_dir / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)

    return {"url": f"/uploads/{name}"}
