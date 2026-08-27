"""Upload file content validation using Pillow magic bytes."""

import io
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

_MIN_MAGIC_BYTES = 8

_ALLOWED_FORMATS = {
    "PNG": ".png",
    "JPEG": ".jpg",
}


def validate_image_content(file: UploadFile) -> tuple[str, bytes]:
    """Read the file, verify it is a valid image via Pillow, return the extension and data.

    Raises HTTPException 415 if the content is not a supported image format.
    """
    from PIL import Image

    data = file.file.read()
    if len(data) < _MIN_MAGIC_BYTES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File is too small to be a valid image",
        )

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        fmt = img.format
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File content is not a valid image",
        )

    ext = _ALLOWED_FORMATS.get(fmt)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image format: {fmt}. Only PNG and JPEG are allowed.",
        )

    return ext, data
