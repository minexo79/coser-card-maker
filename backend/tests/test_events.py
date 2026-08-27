"""Contract tests for /api/events (OEM event-template storage).

Stored records keep the exact shape of ``frontend/src/models/oemCardTemplates.js``
entries: ``{"dayCount": int, "startDate": str, "overWriteCanvas": {...}}``.
The registry starts empty (no bundled seeds); GET is public and PUT/DELETE
require JWT Bearer authentication.
"""

from datetime import datetime, timedelta, timezone

import jwt as pyjwt

TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"


def _jwt(username: str, role: str = "user") -> str:
    payload = {
        "sub": username,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def _auth_headers(username: str | None = None, role: str = "user") -> dict:
    headers = {}
    if username:
        headers["Authorization"] = f"Bearer {_jwt(username, role)}"
    return headers

VALID_TEMPLATE = {
    "dayCount": 2,
    "startDate": "2026-05-30",
    "overWriteCanvas": {
        "baseImagePath": "./img/card_base_2p_test.jpg",
        "fontColor": "#000000",
        "canvas": {"width": 960, "height": 540, "downloadWidth": 960, "downloadHeight": 540},
        "upload": {"maxFileSizeBytes": 5 * 1024 * 1024},
        "imageSlots": [
            {"key": "d1", "label": "第一天", "x": 306.1, "y": 20.2, "width": 284.2, "height": 416.2, "radius": 45},
            {"key": "d2", "label": "第二天", "x": 648.7, "y": 20.2, "width": 284.2, "height": 416.2},
        ],
        "textPositions": {
            "fontFamily": "LINESeedTW, Arial, Helvetica, sans-serif",
            "nickname": {"fontSize": 30, "x": 102.8, "y": 213.5, "width": 165.9, "height": 51.2},
            "message": {"fontSize": 30, "x": 22.6, "y": 315.4, "width": 258.2, "height": 216.2, "lineHeight": 40},
        },
        # extra/unknown fields must survive the roundtrip (forward compatibility)
        "someFutureField": {"keep": True},
    },
}

TEST_EVENT_ID = "testevent01"


def _put_event(api, payload=None, use_jwt=True, event_id=TEST_EVENT_ID):
    headers = _auth_headers("testuser", "admin") if use_jwt else {}
    return api.put(
        f"/api/events/{event_id}",
        json=payload if payload is not None else VALID_TEMPLATE,
        headers=headers,
    )


def test_event_registry_starts_empty(api):
    """後端不內建種子模板；註冊表一開始應為空 dict，由 PUT /api/events 建立條目。"""
    listing = api.get("/api/events")
    assert listing.status_code == 200
    assert listing.json() == {}


def test_get_unknown_event_returns_404(api):
    resp = api.get("/api/events/does-not-exist")
    assert resp.status_code == 404


def test_put_without_or_with_wrong_token_is_unauthorized(api):
    assert _put_event(api, use_jwt=False).status_code == 401
    bad_headers = {"Authorization": "Bearer invalid-token"}
    assert api.put(f"/api/events/{TEST_EVENT_ID}", json=VALID_TEMPLATE, headers=bad_headers).status_code == 401


def test_put_and_get_roundtrip_preserves_shape(api, auth_headers):
    put = _put_event(api)
    assert put.status_code == 200
    result = put.json()
    assert result["dayCount"] == VALID_TEMPLATE["dayCount"]
    assert result["startDate"] == VALID_TEMPLATE["startDate"]
    assert result["overWriteCanvas"] == VALID_TEMPLATE["overWriteCanvas"]
    assert result["createdBy"] == "testuser"

    got = api.get(f"/api/events/{TEST_EVENT_ID}")
    assert got.status_code == 200
    assert got.json()["dayCount"] == VALID_TEMPLATE["dayCount"]

    listing = api.get("/api/events", headers=_auth_headers("testuser")).json()
    assert TEST_EVENT_ID in listing


def test_put_invalid_template_returns_422(api, auth_headers):
    broken = {
        **VALID_TEMPLATE,
        "overWriteCanvas": {**VALID_TEMPLATE["overWriteCanvas"], "canvas": {"height": 100}},
    }
    assert _put_event(api, payload=broken).status_code == 422
    assert _put_event(api, payload={"dayCount": 1}).status_code == 422


def test_put_invalid_event_id_returns_422(api, auth_headers):
    # Path params can never contain "/" (router wouldn't match), so a single
    # segment with illegal characters is the realistic abuse case.
    assert _put_event(api, event_id="bad id!").status_code == 422
    assert _put_event(api, event_id="%20").status_code == 422


def test_delete_requires_token_and_removes_entry(api, auth_headers):
    assert _put_event(api).status_code == 200

    assert api.delete(f"/api/events/{TEST_EVENT_ID}").status_code == 401
    assert api.delete(f"/api/events/{TEST_EVENT_ID}", headers=auth_headers).status_code == 204
    assert api.get(f"/api/events/{TEST_EVENT_ID}").status_code == 404
    assert api.delete(f"/api/events/{TEST_EVENT_ID}", headers=auth_headers).status_code == 404


# ---------------------------------------------------------------------------
# Phase 4 — createdBy ownership & visibility
# ---------------------------------------------------------------------------


def test_put_auto_writes_createdby_from_jwt(api):
    resp = api.put("/api/events/owned01", json=VALID_TEMPLATE, headers=_auth_headers("userA"))
    assert resp.status_code == 200
    assert resp.json()["createdBy"] == "userA"


def test_legacy_template_without_jwt_has_no_createdby(api):
    # With full JWT auth, all templates require authentication and get createdBy
    # This test verifies that unauthenticated PUT returns 401
    assert _put_event(api, use_jwt=False).status_code == 401


def test_non_admin_cannot_overwrite_others_template(api):
    assert api.put("/api/events/shared01", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200
    resp = api.put("/api/events/shared01", json=VALID_TEMPLATE, headers=_auth_headers("userB"))
    assert resp.status_code == 403


def test_non_admin_can_claim_legacy_template(api):
    # With full JWT auth, userA creates template, userB cannot overwrite it
    _put_event(api, event_id="legacy02")
    resp = api.put("/api/events/legacy02", json=VALID_TEMPLATE, headers=_auth_headers("userC"))
    assert resp.status_code == 403


def test_non_admin_cannot_delete_others_template(api):
    assert api.put("/api/events/delete01", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200
    assert api.delete("/api/events/delete01", headers=_auth_headers("userB")).status_code == 403
    assert api.delete("/api/events/delete01", headers=_auth_headers("userA")).status_code == 204


def test_admin_can_edit_and_keeps_original_owner(api):
    assert api.put("/api/events/admin01", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200
    resp = api.put("/api/events/admin01", json=VALID_TEMPLATE, headers=_auth_headers("admin", role="admin"))
    assert resp.status_code == 200
    assert resp.json()["createdBy"] == "userA"


def test_admin_can_delete_others_template(api):
    assert api.put("/api/events/admin02", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200
    assert api.delete("/api/events/admin02", headers=_auth_headers("admin", role="admin")).status_code == 204


def test_get_events_visibility_by_identity(api):
    # Owned by userA
    assert api.put("/api/events/vis01", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200
    # Owned by userA as well (different event ID)
    assert api.put("/api/events/vis02", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200

    admin_list = api.get("/api/events", headers=_auth_headers("admin", role="admin")).json()
    assert "vis01" in admin_list and "vis02" in admin_list

    user_a_list = api.get("/api/events", headers=_auth_headers("userA")).json()
    assert "vis01" in user_a_list and "vis02" in user_a_list

    user_b_list = api.get("/api/events", headers=_auth_headers("userB")).json()
    assert "vis01" not in user_b_list
    assert "vis02" not in user_b_list

    # Anonymous sees no templates (all require authentication)
    anon_list = api.get("/api/events").json()
    assert "vis01" not in anon_list
    assert "vis02" not in anon_list


def test_username_param_cannot_probe_other_users(api):
    assert api.put("/api/events/probe01", json=VALID_TEMPLATE, headers=_auth_headers("userA")).status_code == 200

    resp = api.get("/api/events?username=userA", headers=_auth_headers("userB"))
    assert resp.status_code == 200
    assert "probe01" not in resp.json()

    anon = api.get("/api/events?username=userA").json()
    assert "probe01" not in anon


def test_events_mine_endpoint(api):
    assert api.get("/api/events/mine").status_code == 401

    mine = api.get("/api/events/mine", headers=_auth_headers("userA")).json()
    assert "vis01" in mine and "vis02" in mine

    admin_mine = api.get("/api/events/mine", headers=_auth_headers("admin", role="admin")).json()
    assert "vis01" in admin_mine
