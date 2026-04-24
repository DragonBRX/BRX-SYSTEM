"""
Tests for Agent API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_list_agents_empty():
    response = client.get("/api/v1/agents/list")
    assert response.status_code == 200
    assert response.json() == []


def test_create_agent():
    payload = {
        "name": "test_agent",
        "role": "general",
        "instructions": "Test instructions",
        "model": "llama3.2",
        "tools": [],
    }
    response = client.post("/api/v1/agents/create", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "created"


def test_get_templates():
    response = client.get("/api/v1/agents/templates")
    assert response.status_code == 200
    assert len(response.json()) > 0
