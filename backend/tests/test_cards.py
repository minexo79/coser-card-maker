"""Contract tests for POST /api/cards and GET /api/cards/{id}.

Payload format follows ``card-expect.json``: each stored card carries only
{dayCount, startDate, overWriteCanvas, eventName} (layout snapshot).
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
