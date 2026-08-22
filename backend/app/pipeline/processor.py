import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from ..db.models import RawLog, NormalizedLog, ParserPluginConfig
from .ingest import ingest_raw_log
from .parse import parse_raw_log
from .normalize import normalize_event
from .clean_dedupe import check_and_deduplicate
from .filter import apply_noise_filter
from .ml_detector import run_ml_anomaly_detection

def get_active_plugins(db: Session) -> List[Dict[str, Any]]:
    plugins = []
    db_plugins = db.query(ParserPluginConfig).all()
    for p in db_plugins:
        try:
            plugins.append({
                "name": p.name,
                "pattern": p.pattern,
                "field_mappings": json.loads(p.field_mappings_json)
            })
        except Exception:
            continue
    return plugins


def process_single_log(
    db: Session,
    raw_text: str,
    source_name: str = "unknown",
    custom_plugins: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes full ULPF modular pipeline sequence:
    Ingest -> Parse -> Normalize -> Noise Filter -> Clean/Dedupe -> Store
    """
    if custom_plugins is None:
        custom_plugins = get_active_plugins(db)

    # 1. Lossless Raw Capture
    raw_log = ingest_raw_log(db, raw_text, source_name)

    # 2. Multi-Format Parse
    parsed_data = parse_raw_log(raw_text, custom_plugins)

    # 3. Taxonomy Normalize
    normalized_data = normalize_event(parsed_data)

    # 4. Noise Filter
    is_noise = apply_noise_filter(normalized_data)
    normalized_data["is_noise"] = is_noise

    # 5. Clean & Deduplicate (Sliding Time Window)
    existing_dedup = check_and_deduplicate(db, normalized_data, time_window_seconds=60)
    
    if existing_dedup:
        return {
            "status": "deduplicated",
            "raw_event_id": raw_log.id,
            "normalized_id": existing_dedup.id,
            "event_type": existing_dedup.event_type,
            "format_detected": existing_dedup.format_detected,
            "dup_count": existing_dedup.dup_count,
            "is_noise": existing_dedup.is_noise
        }

    # Save new normalized record
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    new_norm = NormalizedLog(
        raw_event_id=raw_log.id,
        timestamp=normalized_data["timestamp"],
        event_type=normalized_data["event_type"],
        category=normalized_data["category"],
        severity=normalized_data["severity"],
        source_ip=normalized_data["source_ip"],
        destination_ip=normalized_data["destination_ip"],
        source_port=normalized_data["source_port"],
        destination_port=normalized_data["destination_port"],
        user=normalized_data["user"],
        hostname=normalized_data["hostname"],
        service=normalized_data["service"],
        process_id=normalized_data["process_id"],
        action=normalized_data["action"],
        protocol=normalized_data["protocol"],
        bytes_sent=normalized_data["bytes_sent"],
        bytes_received=normalized_data["bytes_received"],
        is_noise=normalized_data["is_noise"],
        dup_count=1,
        first_seen=normalized_data["timestamp"],
        last_seen=normalized_data["timestamp"],
        format_detected=normalized_data["format_detected"],
        extracted_fields_json=json.dumps(normalized_data["extracted_fields"]),
        normalized_at=now_iso
    )
    db.add(new_norm)
    db.commit()
    db.refresh(new_norm)

    return {
        "status": "normalized",
        "raw_event_id": raw_log.id,
        "normalized_id": new_norm.id,
        "event_type": new_norm.event_type,
        "format_detected": new_norm.format_detected,
        "dup_count": 1,
        "is_noise": new_norm.is_noise
    }


def process_raw_batch(db: Session, batch_text: str, source_name: str = "batch_upload") -> Dict[str, Any]:
    lines = [line.strip() for line in batch_text.strip().split("\n") if line.strip()]
    custom_plugins = get_active_plugins(db)

    results = []
    received_count = len(lines)
    parsed_count = 0
    dedup_count = 0
    malformed_count = 0

    for line in lines:
        res = process_single_log(db, line, source_name, custom_plugins)
        results.append(res)
        
        if res.get("format_detected") == "MALFORMED_OR_UNKNOWN":
            malformed_count += 1
        else:
            parsed_count += 1
            
        if res.get("status") == "deduplicated":
            dedup_count += 1

    # Trigger ML Anomaly Engine after batch processing
    alerts = run_ml_anomaly_detection(db)

    return {
        "received": received_count,
        "parsed": parsed_count,
        "deduplicated": dedup_count,
        "malformed": malformed_count,
        "new_alerts_triggered": len(alerts),
        "results_sample": results[:10]
    }
