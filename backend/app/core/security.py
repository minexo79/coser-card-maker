"""Shared-token protection for write operations."""

import secrets

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_token(
    x_api_token: str | None = Header(default=None, alias="x-api-token"),
) -> None:
    if not x_api_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    expected = get_settings().api_token
    if not secrets.compare_digest(x_api_token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
