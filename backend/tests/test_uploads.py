"""Contract tests for POST /api/uploads."""

import base64

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"
    "AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
JPEG_MIN = base64.b64decode(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/ooooA//2Q=="
)


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

    match = re.fullmatch(r"/uploads/[0-9a-f]{32}\.(png|jpe?g|webp)", url)
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
        headers={"Authorization": "Bearer nope"},
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


def test_upload_tampered_png_magic_rejected(api, auth_headers):
    """MIME header says image/png but content is a text file."""
    fake = b"this is not a png file at all"
    resp = api.post(
        "/api/uploads",
        files={"file": ("fake.png", fake, "image/png")},
        headers=auth_headers,
    )
    assert resp.status_code == 415


def test_upload_tiny_file_rejected(api, auth_headers):
    """File smaller than magic bytes length should be rejected."""
    tiny = b"\x89PNG"
    resp = api.post(
        "/api/uploads",
        files={"file": ("tiny.png", tiny, "image/png")},
        headers=auth_headers,
    )
    assert resp.status_code == 415


def test_upload_webp_format_rejected(api, auth_headers):
    """WebP is not in the allowed list even if Pillow can read it."""
    webp_header = b"RIFF\x00\x00\x00\x00WEBP"
    resp = api.post(
        "/api/uploads",
        files={"file": ("img.webp", webp_header, "image/webp")},
        headers=auth_headers,
    )
    assert resp.status_code == 415
