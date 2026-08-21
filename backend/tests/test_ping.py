"""GET /api/ping contract tests."""

import re

ISO8601_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")


def test_ping_returns_ok(api):
    resp = api.get("/api/ping")
    assert resp.status_code == 200


def test_ping_body_fields(api):
    body = api.get("/api/ping").json()

    assert body["status"] == "ok"
    assert isinstance(body["uptime"], (int, float))
    assert body["uptime"] >= 0
    assert ISO8601_RE.match(body["timestamp"]), body["timestamp"]
