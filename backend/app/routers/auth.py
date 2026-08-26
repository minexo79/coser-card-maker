"""/api/auth — JWT-based authentication and user management."""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.security import require_token
from app.services import users

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., alias="oldPassword")
    new_password: str = Field(..., alias="newPassword")


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "user"


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., alias="newPassword")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FORBIDDEN_PASSWORDS = {"changeme", "password", "123456", "admin", "changeme123"}


def _validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if password.lower() in FORBIDDEN_PASSWORDS:
        raise HTTPException(status_code=400, detail="Password is too common")


def _create_jwt(username: str, role: str) -> str:
    settings = get_settings()
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _decode_jwt(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth_header[7:]


def _get_current_user(request: Request) -> dict:
    """Decode JWT and return the user record."""
    token = _extract_bearer_token(request)
    payload = _decode_jwt(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = users.get_user(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _require_admin(request: Request) -> dict:
    """Ensure the current user is an admin."""
    user = _get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _user_public(user: dict) -> dict:
    return {"username": user["username"], "role": user["role"], "created_at": user["created_at"]}


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@router.post("/login")
async def login(body: LoginRequest) -> dict:
    user = users.verify_password(body.username, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_jwt(user["username"], user["role"])
    return {"token": token, "user": _user_public(user)}


# ---------------------------------------------------------------------------
# Authenticated routes (any logged-in user)
# ---------------------------------------------------------------------------

@router.get("/me")
async def me(request: Request) -> dict:
    user = _get_current_user(request)
    return _user_public(user)


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, request: Request) -> dict:
    user = _get_current_user(request)
    if not users.verify_password(user["username"], body.old_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    _validate_password_strength(body.new_password)
    users.update_password(user["username"], body.new_password)
    return {"success": True}


# ---------------------------------------------------------------------------
# Admin-only routes
# ---------------------------------------------------------------------------

@router.get("/users", dependencies=[Depends(_require_admin)])
async def list_users() -> list[dict]:
    return users.list_users()


@router.post("/users", status_code=status.HTTP_201_CREATED, dependencies=[Depends(_require_admin)])
async def create_user(body: CreateUserRequest) -> dict:
    _validate_password_strength(body.password)
    if body.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")
    try:
        user = users.create_user(body.username, body.password, body.role)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return _user_public(user)


@router.delete("/users/{username}", dependencies=[Depends(_require_admin)])
async def delete_user(username: str, request: Request) -> dict:
    current_user = _require_admin(request)
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    if not users.delete_user(username):
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.put("/users/{username}/password", dependencies=[Depends(_require_admin)])
async def reset_password(username: str, body: ResetPasswordRequest) -> dict:
    _validate_password_strength(body.new_password)
    if not users.update_password(username, body.new_password):
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}
