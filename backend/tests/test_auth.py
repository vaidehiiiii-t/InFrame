import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    payload = {
        "email": "host@eventsnap.com",
        "password": "securepassword123",
        "name": "Host Alice",
    }
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "host@eventsnap.com"
    assert data["user"]["name"] == "Host Alice"
    assert "password" not in data["user"]


@pytest.mark.asyncio
async def test_signup_duplicate_email_rejected(client: AsyncClient):
    payload = {
        "email": "duplicate@eventsnap.com",
        "password": "securepassword123",
        "name": "First Alice",
    }
    resp1 = await client.post("/api/v1/auth/signup", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/v1/auth/signup", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # First sign up
    signup_data = {
        "email": "loginuser@eventsnap.com",
        "password": "mypassword123",
        "name": "Login User",
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    # Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@eventsnap.com", "password": "mypassword123"},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "loginuser@eventsnap.com"


@pytest.mark.asyncio
async def test_login_invalid_credentials_generic_error(client: AsyncClient):
    # Wrong password
    resp1 = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@eventsnap.com", "password": "wrongpassword"},
    )
    assert resp1.status_code == 401
    assert resp1.json()["detail"] == "Invalid email or password."


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    signup_data = {
        "email": "me@eventsnap.com",
        "password": "mypassword123",
        "name": "Me User",
    }
    signup_resp = await client.post("/api/v1/auth/signup", json=signup_data)
    token = signup_resp.json()["access_token"]

    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "me@eventsnap.com"
