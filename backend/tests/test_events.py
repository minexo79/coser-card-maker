"""Contract tests for /api/events (OEM event-template storage).

Stored records keep the exact shape of ``frontend/src/models/oemCardTemplates.js``
entries: ``{"dayCount": int, "startDate": str, "overWriteCanvas": {...}}``.
The registry starts empty (no bundled seeds); GET is public and PUT/DELETE
require the shared API token.
"""

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


def _put_event(api, payload=None, token="test-token", event_id=TEST_EVENT_ID):
    headers = {} if token is None else {"x-api-token": token}
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
    assert _put_event(api, token=None).status_code == 401
    assert _put_event(api, token="nope").status_code == 401


def test_put_and_get_roundtrip_preserves_shape(api, auth_headers):
    put = _put_event(api)
    assert put.status_code == 200
    assert put.json() == VALID_TEMPLATE

    got = api.get(f"/api/events/{TEST_EVENT_ID}")
    assert got.status_code == 200
    assert got.json() == VALID_TEMPLATE

    listing = api.get("/api/events").json()
    assert listing[TEST_EVENT_ID] == VALID_TEMPLATE


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
