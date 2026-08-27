"""/api/auth — JWT-based authentication and user management."""

import re
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services import audit
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


def _validate_password_strength(password: str, username: str | None = None) -> None:
    """Enforce password complexity policy (P-005).

    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one digit (0-9)
    - At least one special character
    - Not in the common password blacklist
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="密碼長度至少需要 8 個字元")

    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="密碼需要包含至少一個大寫字母")

    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="密碼需要包含至少一個小寫字母")

    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="密碼需要包含至少一個數字")

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
        raise HTTPException(status_code=400, detail="密碼需要包含至少一個特殊字元")

    if password.lower() in FORBIDDEN_PASSWORDS:
        raise HTTPException(status_code=400, detail="此密碼過於常見，請更換")

    if username and password.lower() == username.lower():
        raise HTTPException(status_code=400, detail="密碼不能與使用者名稱相同")


def _create_jwt(username: str, role: str) -> str:
    settings = get_settings()
    payload = {
        "sub": username,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _create_refresh_token(username: str) -> str:
    settings = get_settings()
    payload = {
        "sub": username,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_expiry_days),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _decode_jwt(token: str, expected_type: str = "access") -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
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
async def login(body: LoginRequest, response: Response, request: Request) -> dict:
    user = users.verify_password(body.username, body.password)
    if user is None:
        audit.log_event(
            audit.LOGIN_FAILURE,
            actor=body.username,
            ip_address=request.client.host if request.client else None,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    audit.log_event(
        audit.LOGIN_SUCCESS,
        actor=user["username"],
        ip_address=request.client.host if request.client else None,
    )

    access_token = _create_jwt(user["username"], user["role"])
    refresh_token = _create_refresh_token(user["username"])

    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.jwt_refresh_expiry_days * 86400,
        path="/api/auth",
    )

    return {"token": access_token, "user": _user_public(user)}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response) -> dict:
    """Use refresh token (cookie) to obtain a new access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = jwt.decode(
            refresh_token,
            get_settings().jwt_secret,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    username = payload.get("sub")
    user = users.get_user(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = _create_jwt(user["username"], user["role"])
    new_refresh = _create_refresh_token(user["username"])

    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.jwt_refresh_expiry_days * 86400,
        path="/api/auth",
    )

    return {"token": new_access, "user": _user_public(user)}


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"success": True}


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
    _validate_password_strength(body.new_password, user["username"])
    users.update_password(user["username"], body.new_password)

    audit.log_event(
        audit.PASSWORD_CHANGE,
        actor=user["username"],
        ip_address=request.client.host if request.client else None,
    )
    return {"success": True}


# ---------------------------------------------------------------------------
# Admin-only routes
# ---------------------------------------------------------------------------

@router.get("/users", dependencies=[Depends(_require_admin)])
async def list_users() -> list[dict]:
    return users.list_users()


@router.post("/users", status_code=status.HTTP_201_CREATED, dependencies=[Depends(_require_admin)])
async def create_user(body: CreateUserRequest, request: Request) -> dict:
    _validate_password_strength(body.password, body.username)
    if body.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")
    try:
        user = users.create_user(body.username, body.password, body.role)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    admin_user = _require_admin(request)
    audit.log_event(
        audit.USER_CREATE,
        actor=admin_user["username"],
        target=body.username,
        detail={"role": body.role},
        ip_address=request.client.host if request.client else None,
    )
    return _user_public(user)


@router.delete("/users/{username}", dependencies=[Depends(_require_admin)])
async def delete_user(username: str, request: Request) -> dict:
    current_user = _require_admin(request)
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    if not users.delete_user(username):
        raise HTTPException(status_code=404, detail="User not found")

    audit.log_event(
        audit.USER_DELETE,
        actor=current_user["username"],
        target=username,
        ip_address=request.client.host if request.client else None,
    )
    return {"success": True}


@router.put("/users/{username}/password", dependencies=[Depends(_require_admin)])
async def reset_password(username: str, body: ResetPasswordRequest, request: Request) -> dict:
    _validate_password_strength(body.new_password, username)
    if not users.update_password(username, body.new_password):
        raise HTTPException(status_code=404, detail="User not found")

    admin_user = _require_admin(request)
    audit.log_event(
        audit.PASSWORD_RESET,
        actor=admin_user["username"],
        target=username,
        ip_address=request.client.host if request.client else None,
    )
    return {"success": True}


# ---------------------------------------------------------------------------
# Audit log query (admin-only)
# ---------------------------------------------------------------------------

@router.get("/audit-logs", dependencies=[Depends(_require_admin)])
async def list_audit_logs(
    limit: int = Query(default=100, le=1000),
    event_type: str | None = Query(default=None),
    actor: str | None = Query(default=None),
) -> list[dict]:
    return audit.get_logs(limit=limit, event_type=event_type, actor=actor)
