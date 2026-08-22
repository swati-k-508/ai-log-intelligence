from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..db.models import RawLog

def ingest_raw_log(db: Session, raw_text: str, source_name: str = "unknown") -> RawLog:
    """
    Stage 1: Lossless Raw Capture
    Stores raw log text verbatim in SQLite database before any parsing or processing.
    Assigns a permanent unique ID (UUID v4).
    """
    raw_text_stripped = raw_text.strip()
    raw_log_entry = RawLog(
        raw_text=raw_text_stripped,
        source_name=source_name,
        received_at=datetime.now(timezone.utc)
    )
    db.add(raw_log_entry)
    db.commit()
    db.refresh(raw_log_entry)
    return raw_log_entry
