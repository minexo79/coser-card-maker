"""POST /api/uploads — JWT-protected image upload with server-side filenames."""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.core.file_validation import validate_image_content
from app.core.security import require_jwt_write

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_jwt_write),
) -> dict:
    settings = get_settings()

    ext, data = validate_image_content(file)

    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.uploads_dir / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)

    return {"url": f"/uploads/{name}"}
