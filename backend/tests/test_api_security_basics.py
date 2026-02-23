from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"


def test_register_rejects_weak_password():
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "weakpass"},
    )
    assert response.status_code == 422


def test_pending_response_requires_auth():
    response = client.get("/api/response/pending")
    assert response.status_code == 401
