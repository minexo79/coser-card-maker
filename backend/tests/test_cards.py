"""Contract tests for POST /api/cards and GET /api/cards/{id}."""

VALID_PAYLOAD = {
    "dayCount": 2,
    "eventName": None,
    "sharedFormData": {"nickname": "tester", "message": "hello", "category": "COSER"},
    "dayDetails": {
        "d1": {"date": "2026-05-23", "cosrole": ""},
        "d2": {"date": "2026-05-24", "cosrole": "Miku"},
    },
    "imageDatas": {"d1": "/uploads/a.png"},
    "imageOffsets": {"d1": 10},
    "titleImageData": None,
}


def _post_card(api, payload=None, token="test-token"):
    headers = {} if token is None else {"x-api-token": token}
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


def test_payload_unknown_fields_are_stripped(api, auth_headers):
    payload = {**VALID_PAYLOAD, "hackerField": "<script>"}
    post = api.post("/api/cards", json=payload, headers=auth_headers)
    assert post.status_code == 201

    body = api.get(f"/api/cards/{post.json()['id']}").json()
    assert "hackerField" not in body["payload"]


def test_payload_over_limit_returns_413(api, auth_headers):
    big_message = "x" * (5 * 1024 * 1024)  # > 5MB body once serialized
    payload = {
        **VALID_PAYLOAD,
        "sharedFormData": {**VALID_PAYLOAD["sharedFormData"], "message": big_message},
    }
    resp = api.post("/api/cards", json=payload, headers=auth_headers)
    assert resp.status_code == 413
