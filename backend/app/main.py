"""CCM backend entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware as StarletteCORSMiddleware

from app.core.config import get_settings
from app.routers import auth, cards, events, ping, uploads


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """A-009: Reject requests exceeding the global body size limit early."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > get_settings().max_request_bytes:
            return Response(status_code=413, content="Request body too large")
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create initial admin account if needed
    from app.services.users import ensure_initial_admin

    ensure_initial_admin()
    yield


settings = get_settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.uploads_dir.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="CCM Backend", version="1.0.0", lifespan=lifespan)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["content-type", "authorization"],
)

app.include_router(ping.router)
app.include_router(cards.router)
app.include_router(events.router)
app.include_router(uploads.router)
app.include_router(auth.router)

uploads_app = StaticFiles(directory=str(settings.uploads_dir))
app.mount(
    "/uploads",
    StarletteCORSMiddleware(
        uploads_app,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "HEAD", "OPTIONS"],
        allow_headers=["*"],
    ),
    name="uploads",
)
