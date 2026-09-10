from datetime import date, timedelta
import pytest
from httpx import AsyncClient
from app.core.rate_limit import reset_rate_limit


@pytest.mark.asyncio
async def test_create_event_unauthenticated(client: AsyncClient):
    payload = {
        "name": "Unauthorized Event",
        "event_date": str(date.today() + timedelta(days=1)),
        "retention_days": 30,
    }
    response = await client.post("/api/v1/events", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_event_authenticated_success(client: AsyncClient):
    # Create host
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "alice_host@test.com", "password": "password123", "name": "Alice Host"},
    )
    token = signup_resp.json()["access_token"]

    event_date_str = str(date.today() + timedelta(days=5))
    payload = {
        "name": "Summer Tech Gala 2026",
        "event_date": event_date_str,
        "retention_days": 45,
    }
    response = await client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Summer Tech Gala 2026"
    assert len(data["pin_code"]) == 8
    assert data["retention_days"] == 45
    assert data["rekognition_collection_id"].startswith("eventsnap-event-")
    assert data["is_host"] is True
    assert data["member_count"] == 1


@pytest.mark.asyncio
async def test_create_event_invalid_retention_days(client: AsyncClient):
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "bob_host@test.com", "password": "password123", "name": "Bob Host"},
    )
    token = signup_resp.json()["access_token"]

    # Retention days > 180 should be rejected by Pydantic validation
    payload = {
        "name": "Too Long Event",
        "event_date": str(date.today()),
        "retention_days": 200,
    }
    response = await client.post(
        "/api/v1/events",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_join_event_flow(client: AsyncClient):
    # Host creates event
    host_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "host1@test.com", "password": "password123", "name": "Host One"},
    )
    host_token = host_resp.json()["access_token"]

    create_resp = await client.post(
        "/api/v1/events",
        json={"name": "Birthday Party", "event_date": str(date.today()), "retention_days": 14},
        headers={"Authorization": f"Bearer {host_token}"},
    )
    pin = create_resp.json()["pin_code"]
    event_id = create_resp.json()["id"]

    # Guest signs up
    guest_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "guest1@test.com", "password": "password123", "name": "Guest One"},
    )
    guest_token = guest_resp.json()["access_token"]

    # Guest joins with PIN
    join_resp = await client.post(
        "/api/v1/events/join",
        json={"pin_code": pin},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert join_resp.status_code == 200
    join_data = join_resp.json()
    assert "Successfully joined" in join_data["message"]
    assert join_data["event"]["id"] == event_id

    # Second join attempt by same guest is idempotent
    join_again = await client.post(
        "/api/v1/events/join",
        json={"pin_code": pin},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert join_again.status_code == 200
    assert "already a member" in join_again.json()["message"]


@pytest.mark.asyncio
async def test_join_event_invalid_pin(client: AsyncClient):
    guest_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "guest_invalid@test.com", "password": "password123", "name": "Guest"},
    )
    guest_token = guest_resp.json()["access_token"]

    join_resp = await client.post(
        "/api/v1/events/join",
        json={"pin_code": "INVALID8"},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert join_resp.status_code == 404
    assert join_resp.json()["detail"] == "Invalid event PIN code."


@pytest.mark.asyncio
async def test_join_event_rate_limiting(client: AsyncClient):
    guest_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "ratelimit_user@test.com", "password": "password123", "name": "Rate User"},
    )
    guest_token = guest_resp.json()["access_token"]
    user_id = guest_resp.json()["user"]["id"]
    client_id = f"user:{user_id}"
    reset_rate_limit(client_id)

    # 5 attempts are allowed
    for _ in range(5):
        resp = await client.post(
            "/api/v1/events/join",
            json={"pin_code": "BADPIN99"},
            headers={"Authorization": f"Bearer {guest_token}"},
        )
        assert resp.status_code == 404

    # 6th attempt should be blocked by rate limit (HTTP 429)
    blocked_resp = await client.post(
        "/api/v1/events/join",
        json={"pin_code": "BADPIN99"},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert blocked_resp.status_code == 429
    assert "Too many join attempts" in blocked_resp.json()["detail"]
    assert "Retry-After" in blocked_resp.headers
