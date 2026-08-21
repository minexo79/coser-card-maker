"""Contract tests for POST /api/uploads."""

import base64

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"
    "AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
JPEG_MIN = b"\xff\xd8\xff\xe0" + b"\x00" * 16 + b"\xff\xd9"
GIF_MIN = b"GIF89a" + b"\x00" * 16


def test_upload_png_returns_url(api, auth_headers, uploads_dir):
    resp = api.post(
        "/api/uploads",
        files={"file": ("hello.png", PNG_1PX, "image/png")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    url = resp.json()["url"]
    assert re_url(url) == "png"

    served = api.get(url)
    assert served.status_code == 200
    assert served.headers["content-type"] == "image/png"


def re_url(url):
    import re

    match = re.fullmatch(r"/uploads/[0-9a-f]{32}\.(png|jpe?g|webp|gif)", url)
    assert match is not None, f"unexpected upload url: {url}"
    return match.group(1)


def test_upload_jpeg_returns_jpeg_url(api, auth_headers):
    resp = api.post(
        "/api/uploads",
        files={"file": ("photo.jpg", JPEG_MIN, "image/jpeg")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert re_url(resp.json()["url"]) == "jpg"


def test_upload_gif_returns_gif_url(api, auth_headers):
    resp = api.post(
        "/api/uploads",
        files={"file": ("anim.gif", GIF_MIN, "image/gif")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert re_url(resp.json()["url"]) == "gif"


def test_upload_without_token_is_unauthorized(api):
    resp = api.post(
        "/api/uploads",
        files={"file": ("hello.png", PNG_1PX, "image/png")},
    )
    assert resp.status_code == 401


def test_upload_with_wrong_token_is_unauthorized(api):
    resp = api.post(
        "/api/uploads",
        files={"file": ("hello.png", PNG_1PX, "image/png")},
        headers={"x-api-token": "nope"},
    )
    assert resp.status_code == 401


def test_upload_non_image_is_unsupported_media_type(api, auth_headers):
    resp = api.post(
        "/api/uploads",
        files={"file": ("evil.txt", b"<script>alert(1)</script>", "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 415


def test_upload_oversized_image_returns_413(api, auth_headers):
    big_blob = PNG_1PX + b"\x00" * (MAX_UPLOAD_BYTES + 1)
    resp = api.post(
        "/api/uploads",
        files={"file": ("huge.png", big_blob, "image/png")},
        headers=auth_headers,
    )
    assert resp.status_code == 413


def test_upload_filenames_are_not_trusted(api, auth_headers, uploads_dir):
    resp = api.post(
        "/api/uploads",
        files={"file": ("../../etc/passwd.png", PNG_1PX, "image/png")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    stored_names = {p.name for p in uploads_dir.glob("*")}
    assert "../../etc/passwd.png" not in stored_names
