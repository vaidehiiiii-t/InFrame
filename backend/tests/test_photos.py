import io
import pytest
from httpx import AsyncClient


async def get_auth_token(client: AsyncClient, email: str, name: str = "Test User") -> str:
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "password123", "name": name},
    )
    return res.json()["access_token"]


async def create_test_event(client: AsyncClient, token: str, name: str = "Gallery Gala") -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.post(
        "/api/v1/events",
        headers=headers,
        json={"name": name, "event_date": "2026-10-15", "retention_days": 30},
    )
    return res.json()


@pytest.mark.asyncio
async def test_photo_upload_success(client: AsyncClient):
    token = await get_auth_token(client, "host@example.com")
    event = await create_test_event(client, token)
    event_id = event["id"]

    # Fake JPEG image bytes
    fake_jpeg = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100)

    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("celebration.jpg", fake_jpeg, "image/jpeg")}
    res = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files=files)

    assert res.status_code == 201
    data = res.json()
    assert data["message"] == "Photo uploaded successfully."
    assert data["is_duplicate"] is False
    assert data["photo"]["file_name"] == "celebration.jpg"
    assert data["photo"]["event_id"] == event_id
    assert data["photo"]["is_uploader"] is True
    assert data["photo"]["file_url"].startswith("/uploads/events/")


@pytest.mark.asyncio
async def test_photo_upload_unsupported_format(client: AsyncClient):
    token = await get_auth_token(client, "host_format@example.com")
    event = await create_test_event(client, token)
    event_id = event["id"]

    fake_text = io.BytesIO(b"Hello world, not an image")
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("notes.txt", fake_text, "text/plain")}
    res = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files=files)

    assert res.status_code == 400
    assert "Unsupported image format" in res.json()["detail"]


@pytest.mark.asyncio
async def test_photo_duplicate_detection(client: AsyncClient):
    token = await get_auth_token(client, "host_dup@example.com")
    event = await create_test_event(client, token)
    event_id = event["id"]

    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"exact_same_content" * 20)

    headers = {"Authorization": f"Bearer {token}"}
    files1 = {"file": ("sunset.png", fake_png, "image/png")}
    res1 = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files=files1)
    assert res1.status_code == 201
    assert res1.json()["is_duplicate"] is False

    # Upload exact same file again to same event
    fake_png.seek(0)
    files2 = {"file": ("sunset_copy.png", fake_png, "image/png")}
    res2 = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files=files2)
    assert res2.status_code == 201
    assert res2.json()["is_duplicate"] is True
    assert "duplicate detected" in res2.json()["message"].lower()


@pytest.mark.asyncio
async def test_get_event_photos_and_delete(client: AsyncClient):
    token = await get_auth_token(client, "host_gallery@example.com")
    event = await create_test_event(client, token)
    event_id = event["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload 2 different photos
    f1 = io.BytesIO(b"\xff\xd8\xff\xe0" + b"unique_photo_1" * 10)
    f2 = io.BytesIO(b"\xff\xd8\xff\xe0" + b"unique_photo_2" * 10)

    res1 = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files={"file": ("p1.jpg", f1, "image/jpeg")})
    assert res1.status_code == 201
    photo1_id = res1.json()["photo"]["id"]

    res2 = await client.post(f"/api/v1/events/{event_id}/photos", headers=headers, files={"file": ("p2.jpg", f2, "image/jpeg")})
    assert res2.status_code == 201
    photo2_id = res2.json()["photo"]["id"]

    # Get photos
    gallery_res = await client.get(f"/api/v1/events/{event_id}/photos", headers=headers)
    assert gallery_res.status_code == 200
    photos = gallery_res.json()
    assert len(photos) == 2
    assert photos[0]["id"] == photo2_id  # Newest first

    # Delete photo 1
    del_res = await client.delete(f"/api/v1/events/{event_id}/photos/{photo1_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify only 1 photo remains
    gallery_res_after = await client.get(f"/api/v1/events/{event_id}/photos", headers=headers)
    assert len(gallery_res_after.json()) == 1
    assert gallery_res_after.json()[0]["id"] == photo2_id


@pytest.mark.asyncio
async def test_non_member_cannot_access_photos(client: AsyncClient):
    host_token = await get_auth_token(client, "actual_host@example.com")
    event = await create_test_event(client, host_token)
    event_id = event["id"]

    outsider_token = await get_auth_token(client, "outsider@example.com")
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # Outsider cannot get photos
    get_res = await client.get(f"/api/v1/events/{event_id}/photos", headers=outsider_headers)
    assert get_res.status_code == 403

    # Outsider cannot upload photo
    f = io.BytesIO(b"\xff\xd8\xff\xe0" + b"trespasser" * 10)
    upload_res = await client.post(f"/api/v1/events/{event_id}/photos", headers=outsider_headers, files={"file": ("intruder.jpg", f, "image/jpeg")})
    assert upload_res.status_code == 403
