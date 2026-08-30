"""Image upload storage backed by Cloudflare R2 / S3 (with local-disk fallback).

- ``POST /api/uploads`` — JWT-protected image upload with server-side filenames.
- ``GET /uploads/{key}`` — proxy-retrieves a stored object (from R2 or local disk).
"""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status

from app.core.config import get_settings
from app.core.file_validation import validate_image_content
from app.core.security import require_jwt_write
from app.services import object_storage

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

files_router = APIRouter(prefix="/uploads", tags=["uploads-files"])


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
    object_storage.save_object(name, data)

    return {"url": f"/uploads/{name}"}


@files_router.get("/{file_key}")
async def get_uploaded_file(file_key: str) -> Response:
    if not object_storage.is_valid_key(file_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found")
    data = object_storage.get_object(file_key)
    if data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found")
    return Response(content=data, media_type=object_storage.content_type_for(file_key))
