import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any

def standardize_timestamp(ts_str: Optional[str]) -> str:
    """
    Standardize timestamp strings to ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ).
    Handles relative times, syslog dates ('Aug 22 10:31:04'), and full ISO formats.
    """
    now = datetime.now(timezone.utc)
    if not ts_str:
        return now.strftime("%Y-%m-%dT%H:%M:%SZ")

    ts_str = str(ts_str).strip()
    
    # Try ISO format
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass

    # Try standard YYYY-MM-DD HH:MM:SS
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y/%m/%d %H:%M:%S"):
        try:
            dt = datetime.strptime(ts_str, fmt).replace(tzinfo=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            pass

    # Try Syslog BSD format: Aug 22 10:31:04
    try:
        dt = datetime.strptime(ts_str, "%b %d %H:%M:%S").replace(year=now.year, tzinfo=timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass

    # Try HH:MM:SS shorthand format
    try:
        dt_time = datetime.strptime(ts_str, "%H:%M:%S")
        dt = now.replace(hour=dt_time.hour, minute=dt_time.minute, second=dt_time.second, microsecond=0)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass

    # Fallback to current UTC timestamp
    return now.strftime("%Y-%m-%dT%H:%M:%SZ")


TAXONOMY_MAP = [
    # AUTHENTICATION_FAILURE
    (r'(?i)(failed password|login_fail|auth_failure|invalid credentials|authentication failed|auth_err|bad_password)', 
     "AUTHENTICATION_FAILURE", "AUTH", "HIGH", "DENY"),

    # AUTHENTICATION_SUCCESS
    (r'(?i)(accepted password|login_success|auth_success|authenticated successfully|user_logged_in)', 
     "AUTHENTICATION_SUCCESS", "AUTH", "INFO", "ALLOW"),

    # PRIVILEGE_ESCALATION
    (r'(?i)(sudo:|privilege_escalation|su root|granted admin privileges|role_changed_to_admin)', 
     "PRIVILEGE_ESCALATION", "SECURITY", "CRITICAL", "SUCCESS"),

    # PORT_SCAN
    (r'(?i)(port_scan|syn_scan|scan_detected|reconnaissance|portscan)', 
     "PORT_SCAN", "SECURITY", "HIGH", "ALERT"),

    # CONNECTION_BLOCKED
    (r'(?i)(connection_blocked|firewall_deny|deny tcp|drop udp|packet_dropped|access_denied|unauthorized_access)', 
     "CONNECTION_BLOCKED", "NETWORK", "MEDIUM", "DROP"),

    # CONNECTION_ALLOWED
    (r'(?i)(connection_allowed|firewall_allow|allow tcp|pass udp|connection_established)', 
     "CONNECTION_ALLOWED", "NETWORK", "LOW", "ALLOW"),
]

def normalize_event(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 3: Taxonomy Normalization Engine
    Maps raw log text and variant event types into standard canonical taxonomy schema.
    """
    event_raw = str(parsed_data.get("event_raw") or "")
    format_detected = parsed_data.get("format", "UNKNOWN")

    canonical_event_type = "SYSTEM_CHATTER"
    category = "SYSTEM"
    severity = "LOW"
    action = parsed_data.get("action") or "UNKNOWN"

    if format_detected == "MALFORMED_OR_UNKNOWN":
        canonical_event_type = "MALFORMED_LOG"
        category = "SYSTEM"
        severity = "MEDIUM"
        action = "UNKNOWN"
    else:
        # Match against taxonomy map
        for pattern, ev_type, cat, sev, default_act in TAXONOMY_MAP:
            if re.search(pattern, event_raw):
                canonical_event_type = ev_type
                category = cat
                severity = sev
                if action in (None, "UNKNOWN", ""):
                    action = default_act
                break

    iso_timestamp = standardize_timestamp(parsed_data.get("timestamp"))

    # Parse ports safely
    def clean_port(p):
        if p is None: return None
        try:
            val = int(p)
            return val if 0 <= val <= 65535 else None
        except Exception:
            return None

    # Parse bytes safely
    def clean_int(b):
        try:
            return max(0, int(b))
        except Exception:
            return 0

    return {
        "timestamp": iso_timestamp,
        "event_type": canonical_event_type,
        "category": category,
        "severity": severity,
        "source_ip": parsed_data.get("src_ip"),
        "destination_ip": parsed_data.get("dst_ip"),
        "source_port": clean_port(parsed_data.get("src_port")),
        "destination_port": clean_port(parsed_data.get("dst_port")),
        "user": parsed_data.get("user"),
        "hostname": parsed_data.get("hostname"),
        "service": parsed_data.get("service"),
        "process_id": clean_int(parsed_data.get("process_id")) if parsed_data.get("process_id") else None,
        "action": str(action).upper(),
        "protocol": str(parsed_data.get("protocol")).upper() if parsed_data.get("protocol") else None,
        "bytes_sent": clean_int(parsed_data.get("bytes_sent")),
        "bytes_received": clean_int(parsed_data.get("bytes_received")),
        "format_detected": format_detected,
        "extracted_fields": parsed_data.get("raw_fields", {}),
    }
