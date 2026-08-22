import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import RawLog, NormalizedLog, Alert
from app.pipeline.ingest import ingest_raw_log
from app.pipeline.parse import parse_raw_log
from app.pipeline.normalize import normalize_event
from app.pipeline.clean_dedupe import check_and_deduplicate
from app.pipeline.filter import apply_noise_filter
from app.pipeline.ml_detector import run_ml_anomaly_detection
from app.pipeline.processor import process_single_log, process_raw_batch
from app.seed.generator import get_nexora_seed_logs

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_stage1_lossless_capture(db_session):
    raw_str = "Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2"
    raw_entry = ingest_raw_log(db_session, raw_str, source_name="unit_test")
    assert raw_entry.id is not None
    assert raw_entry.raw_text == raw_str
    assert db_session.query(RawLog).count() == 1

def test_stage2_multi_format_parsing():
    # 1. Syslog
    syslog_text = "Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2"
    p1 = parse_raw_log(syslog_text)
    assert p1["format"] == "SYSLOG"
    assert p1["src_ip"] == "192.168.1.100"
    assert p1["user"] == "admin"

    # 2. KV Pipe
    kv_text = "2026-08-22T10:31:05Z | AUTH_FAILURE | user=admin | ip=192.168.1.100 | port=22 | action=block"
    p2 = parse_raw_log(kv_text)
    assert p2["format"] == "KV_PIPE"
    assert p2["src_ip"] == "192.168.1.100"
    assert p2["user"] == "admin"

    # 3. Bracketed
    bracketed_text = "[2026-08-22T10:31:08Z] LOGIN_FAIL user=admin ip=192.168.1.100 action=DENY host=fw-01"
    p3 = parse_raw_log(bracketed_text)
    assert p3["format"] == "BRACKETED"
    assert p3["src_ip"] == "192.168.1.100"

    # 4. JSON Lines
    json_text = '{"timestamp": "2026-08-22T10:31:10Z", "event": "Authentication Failed", "src_ip": "192.168.1.100", "user": "admin"}'
    p4 = parse_raw_log(json_text)
    assert p4["format"] == "JSON_LINES"
    assert p4["src_ip"] == "192.168.1.100"

    # 5. Malformed fallback (Never crashes)
    malformed_text = "GARBAGE_LINE_###_CORRUPTED"
    p5 = parse_raw_log(malformed_text)
    assert p5["format"] == "MALFORMED_OR_UNKNOWN"

def test_stage3_normalize():
    raw_parsed = {
        "format": "SYSLOG",
        "timestamp": "Aug 22 10:31:04",
        "event_raw": "Failed password for invalid user admin",
        "src_ip": "192.168.1.100",
        "user": "admin",
        "action": "DENY"
    }
    norm = normalize_event(raw_parsed)
    assert norm["event_type"] == "AUTHENTICATION_FAILURE"
    assert norm["category"] == "AUTH"
    assert norm["severity"] == "HIGH"
    assert "2026-08-22" in norm["timestamp"] or "T" in norm["timestamp"]

def test_stage4_deduplication(db_session):
    raw_str = "Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2"
    
    # Process line 1
    r1 = process_single_log(db_session, raw_str, source_name="test")
    assert r1["status"] == "normalized"
    assert r1["dup_count"] == 1

    # Process identical line 2 immediately (within 60s window)
    r2 = process_single_log(db_session, raw_str, source_name="test")
    assert r2["status"] == "deduplicated"
    assert r2["dup_count"] == 2
    assert db_session.query(NormalizedLog).count() == 1

def test_full_nexora_batch_and_ml_detection(db_session):
    seed_text = get_nexora_seed_logs()
    summary = process_raw_batch(db_session, seed_text, source_name="nexora_seed")
    
    assert summary["received"] > 0
    assert summary["parsed"] > 0
    assert db_session.query(RawLog).count() == summary["received"]
    assert db_session.query(NormalizedLog).count() > 0
    
    # Check Alerts generated
    alerts = db_session.query(Alert).all()
    assert len(alerts) > 0
    # Confirm plain language explanations are present
    for alert in alerts:
        assert len(alert.explanation) > 20
        assert alert.severity in ("HIGH", "CRITICAL")
