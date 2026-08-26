"""CCM backend entrypoint."""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.routers import cards, events, ping, uploads


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


settings = get_settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.uploads_dir.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="CCM Backend", version="1.0.0")

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["x-api-token", "content-type"],
)

app.include_router(ping.router)
app.include_router(cards.router)
app.include_router(events.router)
app.include_router(uploads.router)

app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir)), name="uploads")
