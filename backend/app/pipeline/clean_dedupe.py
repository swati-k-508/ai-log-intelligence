from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..db.models import NormalizedLog

def check_and_deduplicate(
    db: Session,
    normalized_data: Dict[str, Any],
    time_window_seconds: int = 60
) -> Optional[NormalizedLog]:
    """
    Stage 4: Sliding Time-Window Deduplication Engine.
    Checks if an identical event (same event_type, source_ip, user, destination_ip, action)
    was recorded within the last `time_window_seconds`.
    If found: updates dup_count and last_seen timestamp, and returns the existing record.
    If not found: returns None so caller can insert a new record.
    """
    ev_type = normalized_data.get("event_type")
    src_ip = normalized_data.get("source_ip")
    user = normalized_data.get("user")
    dst_ip = normalized_data.get("destination_ip")
    action = normalized_data.get("action")
    ts_curr = normalized_data.get("timestamp")

    # Search existing normalized records matching signature
    query = db.query(NormalizedLog).filter(
        NormalizedLog.event_type == ev_type,
        NormalizedLog.source_ip == src_ip,
        NormalizedLog.user == user,
        NormalizedLog.destination_ip == dst_ip,
        NormalizedLog.action == action
    ).order_by(NormalizedLog.normalized_at.desc())

    recent_record = query.first()

    if recent_record:
        try:
            # Parse timestamps to compare time window
            dt_curr = datetime.fromisoformat(ts_curr.replace("Z", "+00:00"))
            dt_prev = datetime.fromisoformat(recent_record.last_seen.replace("Z", "+00:00"))
            diff_seconds = abs((dt_curr - dt_prev).total_seconds())

            if diff_seconds <= time_window_seconds:
                # Collapse duplicate event!
                recent_record.dup_count += 1
                recent_record.last_seen = ts_curr
                db.commit()
                db.refresh(recent_record)
                return recent_record
        except Exception:
            pass

    return None
