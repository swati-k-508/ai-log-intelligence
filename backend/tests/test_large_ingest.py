import json
import time
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import RawLog, NormalizedLog, Alert
from app.pipeline.processor import process_raw_batch, extract_batch_items
from app.pipeline.parse import parse_raw_log

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

def test_json_array_ingestion(db_session):
    """Test ingestion of standard JSON array format: [ {...}, {...} ]"""
    logs_array = [
        {"timestamp": "2026-08-24T10:00:00Z", "event": "User login success", "src_ip": "10.0.0.1", "user": "alice", "action": "ALLOW"},
        {"timestamp": "2026-08-24T10:00:01Z", "event": "Failed password for admin", "src_ip": "192.168.1.50", "user": "admin", "action": "DENY"},
        {"timestamp": "2026-08-24T10:00:02Z", "event": "Failed password for admin", "src_ip": "192.168.1.50", "user": "admin", "action": "DENY"},
    ]
    json_text = json.dumps(logs_array)
    
    summary = process_raw_batch(db_session, json_text, source_name="json_array_test")
    assert summary["received"] == 3
    assert summary["parsed"] == 3
    assert summary["deduplicated"] == 1 # 2nd failed password collapsed
    assert db_session.query(RawLog).count() == 3
    assert db_session.query(NormalizedLog).count() == 2

def test_ndjson_and_multiformat_batch(db_session):
    """Test mixed batch with NDJSON, Syslog, KV-pipe, and Bracketed logs"""
    mixed_lines = "\n".join([
        '{"timestamp": "2026-08-24T10:05:00Z", "message": "Login succeeded", "ip": "172.16.0.4", "user": "bob"}',
        'Aug 24 10:05:01 host sshd[4412]: Failed password for invalid user root from 203.0.113.5 port 22 ssh2',
        '2026-08-24T10:05:02Z | AUTH_FAILURE | user=root | ip=203.0.113.5 | port=22 | action=block',
        '[2026-08-24T10:05:03Z] LOGIN_FAIL user=root ip=203.0.113.5 action=DENY host=edge-fw',
        'CORRUPTED_LINE_GARBAGE_12345'
    ])
    
    summary = process_raw_batch(db_session, mixed_lines, source_name="mixed_batch_test")
    assert summary["received"] == 5
    assert summary["parsed"] == 4
    assert summary["malformed"] == 1
    assert db_session.query(RawLog).count() == 5

def test_high_volume_benchmark(db_session):
    """
    Benchmark test: Ingest 25,000 synthetic log records in a single batch.
    Asserts throughput exceeds 5,000 logs/sec and completes within a few seconds.
    """
    sample_records = []
    for i in range(25000):
        ip = f"192.168.1.{i % 250}"
        user = f"user_{i % 100}"
        if i % 10 == 0:
            msg = f"Aug 24 12:00:{i % 60:02d} host sshd[100]: Failed password for {user} from {ip} port 22 ssh2"
        elif i % 10 == 1:
            msg = f"2026-08-24T12:00:{i % 60:02d}Z | AUTH_FAILURE | user={user} | ip={ip} | port=22 | action=block"
        elif i % 10 == 2:
            msg = json.dumps({"timestamp": f"2026-08-24T12:00:{i % 60:02d}Z", "message": "Accepted password", "ip": ip, "user": user, "action": "ALLOW"})
        else:
            msg = f"[2026-08-24T12:00:{i % 60:02d}Z] CONNECTION_ALLOWED host=srv-01 ip={ip} user={user} action=ALLOW"
        sample_records.append(msg)
        
    batch_payload = "\n".join(sample_records)
    
    t0 = time.perf_counter()
    summary = process_raw_batch(db_session, batch_payload, source_name="benchmark_25k")
    t1 = time.perf_counter()
    
    elapsed = t1 - t0
    throughput = len(sample_records) / elapsed
    
    print(f"\n[BENCHMARK] 25,000 logs processed in {elapsed:.2f}s ({throughput:.0f} logs/sec)")
    
    assert summary["received"] == 25000
    assert summary["parsed"] > 0
    assert elapsed < 10.0 # Must finish well within 10s (target is ~1-2s)
    assert db_session.query(RawLog).count() == 25000
