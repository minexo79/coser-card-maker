"""JWT protection for write operations."""

import jwt
from fastapi import Header, HTTPException, Request, status

from app.core.config import get_settings


def require_jwt_write(
    request: Request,
    authorization: str | None = Header(default=None, alias="authorization"),
) -> dict:
    """Require a valid JWT Bearer token for write operations.

    Returns the decoded token payload (containing sub, role).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization[7:]
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return payload
