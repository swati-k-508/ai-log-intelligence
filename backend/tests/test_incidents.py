import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "incidents" in data
    assert data["total"] >= 1
    
    # Verify Demo Incident structure
    demo = data["incidents"][0]
    assert demo["id"] == "INC-2026-8942"
    assert len(demo["events"]) >= 10
    assert demo["risk_level"] == "CRITICAL"

def test_get_incident_detail():
    response = client.get("/api/incidents/INC-2026-8942")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "INC-2026-8942"
    assert "events" in data
    assert "correlation_rules" in data
    assert "baseline_vs_during" in data
    
    # Check 1:1 trace evidence present on step 1
    step1 = data["events"][0]
    assert step1["step_number"] == 1
    assert "raw_log" in step1
    assert "raw_event_id" in step1
    assert step1["raw_event_id"] == "RAW-00481"
