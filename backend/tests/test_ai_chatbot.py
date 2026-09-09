import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import RawLog, NormalizedLog, Alert
from app.pipeline.processor import process_raw_batch
from app.pipeline.ai_chatbot import AIChatbotEngine
from app.seed.generator import get_nexora_seed_logs

@pytest.fixture
def populated_db():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed test dataset
        seed_text = get_nexora_seed_logs()
        process_raw_batch(db, seed_text, source_name="test_ai_suite")
        yield db
    finally:
        db.close()

def test_ai_ip_investigation_query(populated_db):
    """Test AI investigation of specific attacker IP (192.168.1.105)"""
    res = AIChatbotEngine.process_query(populated_db, "Investigate IP 192.168.1.105")
    assert "192.168.1.105" in res["response_text"]
    assert len(res["matching_logs"]) > 0
    assert len(res["suggested_followups"]) > 0
    # Confirm security mitigation advice is generated
    assert "Firewall Block Rule" in res["response_text"] or "Recommended" in res["response_text"]

def test_ai_threat_summary_query(populated_db):
    """Test AI summary of security threat alerts"""
    res = AIChatbotEngine.process_query(populated_db, "Summarize all security threats and active alerts")
    assert "Security Threat Intelligence Summary" in res["response_text"]
    assert len(res["related_alerts"]) > 0
    assert len(res["suggested_followups"]) > 0

def test_ai_pipeline_metrics_query(populated_db):
    """Test AI response to deduplication reduction and pipeline funnel query"""
    res = AIChatbotEngine.process_query(populated_db, "What is the deduplication reduction rate and total raw logs?")
    assert "Pipeline Telemetry" in res["response_text"]
    assert "%" in res["response_text"]
    assert "Raw Logs Ingested" in res["response_text"]

def test_ai_user_investigation_query(populated_db):
    """Test AI investigation of specific user account (sysadmin)"""
    res = AIChatbotEngine.process_query(populated_db, "Show activity and alerts for user sysadmin")
    assert "sysadmin" in res["response_text"]
    assert len(res["matching_logs"]) > 0

def test_ai_event_type_query(populated_db):
    """Test AI query for specific event types (failed logins / auth failures)"""
    res = AIChatbotEngine.process_query(populated_db, "Show all failed password login attempts")
    assert "AUTHENTICATION_FAILURE" in res["response_text"]
    assert len(res["matching_logs"]) > 0

def test_ai_dynamic_suggestions(populated_db):
    """Test that dynamic suggested queries are returned based on database records"""
    suggestions = AIChatbotEngine.get_dynamic_suggestions(populated_db)
    assert isinstance(suggestions, list)
    assert len(suggestions) >= 2
