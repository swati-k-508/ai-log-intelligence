import json
from typing import Optional, List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from ..db.database import get_db
from ..db.models import RawLog, NormalizedLog, Alert, ParserPluginConfig
from ..pipeline.processor import process_single_log, process_raw_batch
from ..pipeline.ml_detector import run_ml_anomaly_detection
from ..seed.generator import get_nexora_seed_logs
from ..pipeline.incident_reconstruction import build_incidents_from_db, get_demo_incident

router = APIRouter(prefix="/api")

class IngestTextRequest(BaseModel):
    raw_text: str
    source_name: Optional[str] = "web_ui"

class AddParserPluginRequest(BaseModel):
    name: str
    pattern: str
    field_mappings: dict # capture group -> canonical field
    description: Optional[str] = None

# 1. Ingest Endpoints
@router.post("/ingest/text")
def ingest_text(req: IngestTextRequest, db: Session = Depends(get_db)):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text cannot be empty")
    result = process_raw_batch(db, req.raw_text, req.source_name)
    return {"status": "success", "summary": result}

@router.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    result = process_raw_batch(db, text, source_name=file.filename)
    return {"status": "success", "filename": file.filename, "summary": result}

@router.post("/ingest/seed")
def ingest_seed_dataset(db: Session = Depends(get_db)):
    seed_text = get_nexora_seed_logs()
    result = process_raw_batch(db, seed_text, source_name="nexora_seed_dataset")
    return {"status": "success", "summary": result}

# 2. Log Exploration & Traceability Endpoints
@router.get("/logs/raw")
def get_raw_logs(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    total = db.query(RawLog).count()
    logs = db.query(RawLog).order_by(RawLog.received_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "logs": [
            {
                "id": l.id,
                "raw_text": l.raw_text,
                "source_name": l.source_name,
                "received_at": l.received_at.isoformat()
            } for l in logs
        ]
    }

@router.get("/logs/normalized")
def get_normalized_logs(
    limit: int = 50,
    offset: int = 0,
    event_type: Optional[str] = None,
    is_noise: Optional[bool] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(NormalizedLog)
    if event_type:
        query = query.filter(NormalizedLog.event_type == event_type)
    if is_noise is not None:
        query = query.filter(NormalizedLog.is_noise == is_noise)
    if severity:
        query = query.filter(NormalizedLog.severity == severity)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (NormalizedLog.source_ip.like(s)) | 
            (NormalizedLog.user.like(s)) | 
            (NormalizedLog.event_type.like(s)) |
            (NormalizedLog.format_detected.like(s))
        )

    total = query.count()
    logs = query.order_by(NormalizedLog.timestamp.desc()).offset(offset).limit(limit).all()

    items = []
    for l in logs:
        extracted = {}
        try:
            extracted = json.loads(l.extracted_fields_json) if l.extracted_fields_json else {}
        except Exception:
            pass

        items.append({
            "id": l.id,
            "raw_event_id": l.raw_event_id,
            "timestamp": l.timestamp,
            "event_type": l.event_type,
            "category": l.category,
            "severity": l.severity,
            "source_ip": l.source_ip,
            "destination_ip": l.destination_ip,
            "source_port": l.source_port,
            "destination_port": l.destination_port,
            "user": l.user,
            "hostname": l.hostname,
            "service": l.service,
            "process_id": l.process_id,
            "action": l.action,
            "protocol": l.protocol,
            "is_noise": l.is_noise,
            "dup_count": l.dup_count,
            "first_seen": l.first_seen,
            "last_seen": l.last_seen,
            "format_detected": l.format_detected,
            "extracted_fields": extracted,
            "normalized_at": l.normalized_at
        })

    return {"total": total, "logs": items}

@router.get("/logs/trace/{normalized_id}")
def trace_raw_log(normalized_id: str, db: Session = Depends(get_db)):
    """
    Traceability endpoint: Fetch normalized record and its verbatim 1:1 linked raw log
    """
    norm = db.query(NormalizedLog).filter(NormalizedLog.id == normalized_id).first()
    if not norm:
        raise HTTPException(status_code=404, detail="Normalized log not found")

    raw = db.query(RawLog).filter(RawLog.id == norm.raw_event_id).first()
    if not raw:
        raise HTTPException(status_code=404, detail="Raw log entry missing")

    return {
        "normalized_event": {
            "id": norm.id,
            "timestamp": norm.timestamp,
            "event_type": norm.event_type,
            "category": norm.category,
            "severity": norm.severity,
            "source_ip": norm.source_ip,
            "destination_ip": norm.destination_ip,
            "user": norm.user,
            "action": norm.action,
            "format_detected": norm.format_detected,
            "dup_count": norm.dup_count,
        },
        "raw_event": {
            "id": raw.id,
            "raw_text": raw.raw_text,
            "source_name": raw.source_name,
            "received_at": raw.received_at.isoformat()
        }
    }

# 3. Pipeline Metrics & Funnel
@router.get("/metrics/funnel")
def get_funnel_metrics(db: Session = Depends(get_db)):
    total_raw = db.query(RawLog).count()
    total_normalized = db.query(NormalizedLog).count()
    
    # Calculate total events ingested including deduplicated counts
    raw_logs = db.query(NormalizedLog).all()
    total_received_events = sum(l.dup_count for l in raw_logs)
    total_deduplicated_events = max(0, total_received_events - total_normalized)
    
    total_noise = db.query(NormalizedLog).filter(NormalizedLog.is_noise == True).count()
    total_security = db.query(NormalizedLog).filter(NormalizedLog.is_noise == False).count()
    total_alerts = db.query(Alert).count()

    # Format Breakdown
    formats_query = db.query(NormalizedLog.format_detected, NormalizedLog.id).all()
    format_counts = {}
    for fmt, _ in formats_query:
        format_counts[fmt] = format_counts.get(fmt, 0) + 1

    # Severity Breakdown
    severities_query = db.query(NormalizedLog.severity, NormalizedLog.id).all()
    severity_counts = {}
    for sev, _ in severities_query:
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    # Event Type Breakdown
    types_query = db.query(NormalizedLog.event_type, NormalizedLog.id).all()
    type_counts = {}
    for et, _ in types_query:
        type_counts[et] = type_counts.get(et, 0) + 1

    return {
        "funnel": {
            "raw_received": total_raw,
            "parsed": total_normalized,
            "deduplicated_collapsed": total_deduplicated_events,
            "effective_normalized_stored": total_normalized,
            "high_value_security": total_security,
            "low_value_noise": total_noise,
            "threat_alerts": total_alerts
        },
        "formats_breakdown": format_counts,
        "severities_breakdown": severity_counts,
        "event_types_breakdown": type_counts
    }

# 4. Alerts Endpoints
@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    res = []
    for a in alerts:
        res.append({
            "id": a.id,
            "title": a.title,
            "threat_type": a.threat_type,
            "severity": a.severity,
            "explanation": a.explanation,
            "source_ip": a.source_ip,
            "target_user": a.target_user,
            "event_count": a.event_count,
            "trigger_event_ids": json.loads(a.trigger_event_ids_json) if a.trigger_event_ids_json else [],
            "created_at": a.created_at
        })
    return {"total": len(res), "alerts": res}

# 5. Plug-and-Play Parser Plugins
@router.get("/parsers")
def list_parser_plugins(db: Session = Depends(get_db)):
    plugins = db.query(ParserPluginConfig).all()
    return {
        "total": len(plugins),
        "parsers": [
            {
                "id": p.id,
                "name": p.name,
                "pattern": p.pattern,
                "field_mappings": json.loads(p.field_mappings_json),
                "description": p.description,
                "created_at": p.created_at.isoformat()
            } for p in plugins
        ]
    }

@router.post("/parsers/add")
def add_parser_plugin(req: AddParserPluginRequest, db: Session = Depends(get_db)):
    existing = db.query(ParserPluginConfig).filter(ParserPluginConfig.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Parser plugin '{req.name}' already exists")
    
    plugin = ParserPluginConfig(
        name=req.name,
        pattern=req.pattern,
        field_mappings_json=json.dumps(req.field_mappings),
        description=req.description
    )
    db.add(plugin)
    db.commit()
    db.refresh(plugin)
    return {"status": "success", "plugin_id": plugin.id, "name": plugin.name}

# 6. Database Reset
@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    db.query(Alert).delete()
    db.query(NormalizedLog).delete()
    db.query(RawLog).delete()
    db.commit()
    return {"status": "success", "message": "Database reset cleanly"}

# 7. Log Time Machine & Incident Replay Endpoints
@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    """
    Returns available reconstructed incident timelines from live DB normalized logs
    plus the built-in deterministic multi-stage Demo Incident.
    """
    incidents = build_incidents_from_db(db)
    return {
        "total": len(incidents),
        "incidents": incidents
    }

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    """
    Returns step-by-step incident replay events, risk progression, correlation chains,
    baseline comparisons, and 1:1 raw log traceability links for a specific incident.
    """
    incidents = build_incidents_from_db(db)
    for inc in incidents:
        if inc["id"] == incident_id:
            return inc
    
    # Fallback to demo incident if ID is demo-related or not found
    return get_demo_incident()
