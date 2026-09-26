"""Contract tests for POST /api/cards and GET /api/cards/{id}.

Payload format follows ``card-expect.json``: each stored card carries only
{dayCount, startDate, overWriteCanvas, eventId, eventName} (layout snapshot).
"""

VALID_PAYLOAD = {
    "dayCount": 1,
    "startDate": "",
    "overWriteCanvas": {
        "baseImagePath": "./img/card_base_1p.png",
        "canvas": {"width": 1220, "height": 700, "downloadWidth": 1220, "downloadHeight": 700},
        "upload": {"maxFileSizeBytes": 5 * 1024 * 1024},
        "imageSlots": [
            {
                "key": "d1",
                "label": "第一天",
                "x": 390.3,
                "y": 83.6,
                "width": 439.5,
                "height": 532.7,
                "dateRole": {"fontSize": 26, "x": 390.3, "y": 616.4, "width": 439.5, "height": 52.6},
            },
        ],
        "titleImage": {"fontSize": 36, "x": 30.8, "y": 31, "width": 324.4, "height": 204.5},
        "textPositions": {
            "fontFamily": "LINESeedTW, Arial, Helvetica, sans-serif",
            "nickname": {"fontSize": 36, "x": 30.8, "y": 323.2, "width": 324.4, "height": 129.1},
            "category": {"fontSize": 36, "x": 30.8, "y": 539.9, "width": 324.4, "height": 129.1},
            "message": {"fontSize": 30, "x": 864.8, "y": 31, "width": 324.4, "height": 341.8, "lineHeight": 42},
        },
    },
    "eventId": None,
    "eventName": None,
}


def _post_card(api, payload=None, token="test-token"):
    headers = {} if token is None else {"Authorization": f"Bearer {token}"}
    return api.post("/api/cards", json=payload if payload is not None else VALID_PAYLOAD, headers=headers)


def test_save_and_load_roundtrip(api, auth_headers):
    post = api.post("/api/cards", json=VALID_PAYLOAD, headers=auth_headers)
    assert post.status_code == 201
    card_id = post.json()["id"]
    assert isinstance(card_id, str) and card_id

    got = api.get(f"/api/cards/{card_id}")
    assert got.status_code == 200

    body = got.json()
    assert body["id"] == card_id
    assert body["eventId"] is None
    assert body["eventName"] is None
    assert body["createdAt"]
    assert body["updatedAt"]
    assert body["payload"] == VALID_PAYLOAD


def test_post_without_token_is_unauthorized(api):
    resp = _post_card(api, token=None)
    assert resp.status_code == 401


def test_post_with_wrong_token_is_unauthorized(api):
    resp = _post_card(api, token="nope")
    assert resp.status_code == 401


def test_get_unknown_card_returns_404(api):
    resp = api.get("/api/cards/does-not-exist")
    assert resp.status_code == 404


def test_payload_user_content_is_stripped(api, auth_headers):
    """使用者內容欄位不應被持久化，僅保留版面快照。"""
    payload = {
        **VALID_PAYLOAD,
        "hackerField": "<script>",
        # 舊版/不該出現的使用者內容欄位
        "sharedFormData": {"nickname": "tester"},
        "dayDetails": {"d1": {"date": "2026-05-23"}},
        "imageDatas": {"d1": "/uploads/a.png"},
        "imageOffsets": {"d1": 10},
        "baseImageData": "/uploads/base.png",
        "titleImageData": "/uploads/old.png",
    }
    post = api.post("/api/cards", json=payload, headers=auth_headers)
    assert post.status_code == 201

    stored = api.get(f"/api/cards/{post.json()['id']}").json()["payload"]
    assert set(stored.keys()) == set(VALID_PAYLOAD.keys())


def test_payload_overwrite_canvas_roundtrip(api, auth_headers):
    post = api.post("/api/cards", json=VALID_PAYLOAD, headers=auth_headers)
    assert post.status_code == 201

    payload = api.get(f"/api/cards/{post.json()['id']}").json()["payload"]
    assert payload["overWriteCanvas"] == VALID_PAYLOAD["overWriteCanvas"]
    assert payload["startDate"] == ""
    assert payload["dayCount"] == 1


def test_payload_over_limit_returns_413(api, auth_headers):
    big_config = "x" * (5 * 1024 * 1024)  # > 5MB body once serialized
    payload = {**VALID_PAYLOAD, "overWriteCanvas": {"junk": big_config}}
    resp = api.post("/api/cards", json=payload, headers=auth_headers)
    assert resp.status_code == 413


def _put_event(api, auth_headers, event_id, name=None):
    template = {
        "dayCount": 1,
        "startDate": "2026-05-30",
        "overWriteCanvas": {"canvas": {"width": 1220, "height": 700}},
    }
    if name is not None:
        template["name"] = name
    resp = api.put(f"/api/events/{event_id}", json=template, headers=auth_headers)
    assert resp.status_code == 200


def test_card_snapshots_event_name_from_template(api, auth_headers):
    _put_event(api, auth_headers, "cardevt01", name="開拓動漫祭")
    payload = {**VALID_PAYLOAD, "eventId": "cardevt01", "eventName": "client-supplied"}
    post = api.post("/api/cards", json=payload, headers=auth_headers)
    assert post.status_code == 201

    body = api.get(f"/api/cards/{post.json()['id']}").json()
    assert body["eventId"] == "cardevt01"
    assert body["eventName"] == "開拓動漫祭"
    assert body["payload"]["eventName"] == "開拓動漫祭"


def test_card_for_unknown_event_has_no_name(api, auth_headers):
    payload = {**VALID_PAYLOAD, "eventId": "no-such-event"}
    post = api.post("/api/cards", json=payload, headers=auth_headers)
    body = api.get(f"/api/cards/{post.json()['id']}").json()
    assert body["eventId"] == "no-such-event"
    assert body["eventName"] is None


def test_legacy_client_event_name_is_treated_as_id(api, auth_headers):
    _put_event(api, auth_headers, "cardevt02", name="CWT70")
    legacy = {k: v for k, v in VALID_PAYLOAD.items() if k != "eventId"}
    post = api.post("/api/cards", json={**legacy, "eventName": "cardevt02"}, headers=auth_headers)
    body = api.get(f"/api/cards/{post.json()['id']}").json()
    assert body["eventId"] == "cardevt02"
    assert body["eventName"] == "CWT70"


def test_legacy_stored_card_backfills_event_id(api):
    from app.core.db import get_collection

    get_collection("cards").insert_one({
        "_id": "legacy000001",
        "id": "legacy000001",
        "eventName": "old-event",
        "createdAt": "2026-01-01T00:00:00+00:00",
        "updatedAt": "2026-01-01T00:00:00+00:00",
        "payload": {"dayCount": 1, "startDate": "", "overWriteCanvas": {}, "eventName": "old-event"},
    })
    body = api.get("/api/cards/legacy000001").json()
    assert body["eventId"] == "old-event"
    assert body["payload"]["eventId"] == "old-event"
