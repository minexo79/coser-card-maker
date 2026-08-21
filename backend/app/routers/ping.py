"""GET /api/ping — liveness heartbeat."""

import time
from datetime import datetime, timezone

from fastapi import APIRouter

START_TIME = time.time()

router = APIRouter()


@router.get("/api/ping")
async def ping() -> dict:
    return {
        "status": "ok",
        "uptime": time.time() - START_TIME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
