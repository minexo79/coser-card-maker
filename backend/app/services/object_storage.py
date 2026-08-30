"""Object storage for base-image uploads.

Uses Cloudflare R2 (S3-compatible, via ``boto3``) when configured; otherwise
falls back to the local ``uploads_dir`` on disk. This mirrors the MongoDB /
mongomock fallback so local dev and the test suite run without R2 credentials.
"""

import re

from app.core.config import get_settings

_KEY_PATTERN = re.compile(r"^[0-9a-f]{32}\.(png|jpe?g)$")

_CONTENT_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}


def is_r2_configured() -> bool:
    settings = get_settings()
    has_creds = bool(
        settings.r2_bucket_name
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
    )
    has_endpoint = bool(settings.r2_endpoint_url or settings.r2_account_id)
    return has_creds and has_endpoint


def _endpoint_url() -> str:
    settings = get_settings()
    if settings.r2_endpoint_url:
        return settings.r2_endpoint_url
    return f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"


def _client():
    import boto3

    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=_endpoint_url(),
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name=settings.r2_region,
    )


def content_type_for(key: str) -> str:
    ext = key.rsplit(".", 1)[-1].lower() if "." in key else ""
    return _CONTENT_TYPES.get(ext, "application/octet-stream")


def is_valid_key(key: str) -> bool:
    return bool(_KEY_PATTERN.fullmatch(key))


def save_object(key: str, data: bytes) -> None:
    """Persist ``data`` under ``key``; to R2 when configured, else local disk."""
    settings = get_settings()
    if is_r2_configured():
        _client().put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type_for(key),
        )
        return
    dest = settings.uploads_dir / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def get_object(key: str) -> bytes | None:
    """Return the object bytes, or None if the key does not exist."""
    settings = get_settings()
    if is_r2_configured():
        try:
            obj = _client().get_object(Bucket=settings.r2_bucket_name, Key=key)
        except Exception:
            return None
        return obj["Body"].read()
    path = settings.uploads_dir / key
    if not path.is_file():
        return None
    return path.read_bytes()
