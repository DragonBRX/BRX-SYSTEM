"""
Tests for LLM model endpoints
"""

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_list_providers():
    response = client.get("/api/v1/models/providers")
    assert response.status_code == 200
    assert "providers" in response.json()


def test_list_models():
    response = client.get("/api/v1/models/list")
    assert response.status_code == 200
    assert "models" in response.json()
