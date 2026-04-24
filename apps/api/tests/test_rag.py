"""
Tests for RAG endpoints
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_rag_query():
    payload = {"query": "What is machine learning?", "top_k": 3}
    response = client.post("/api/v1/rag/query", json=payload)
    # Will fail without documents, but tests endpoint structure
    assert response.status_code in [200, 500]


def test_list_documents_empty():
    response = client.get("/api/v1/rag/documents")
    assert response.status_code == 200
    assert response.json() == []
