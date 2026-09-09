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
        dt = datetime.strptime(f"{now.year} {ts_str}", "%Y %b %d %H:%M:%S").replace(tzinfo=timezone.utc)
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
    # 1. CRITICAL THREATS & EXPLOITS
    (r'(?i)(union\s+select|1%27%20union|select.*from.*users|--\s*http|sqli|sql_injection)', 
     "SQL_INJECTION_ATTEMPT", "SECURITY", "CRITICAL", "BLOCK"),

    (r'(?i)(mimikatz|lsass\.exe|credential\s+dump|sam\s+dump)', 
     "CREDENTIAL_DUMPING_MIMIKATZ", "SECURITY", "CRITICAL", "ALERT"),

    (r'(?i)(malicious_c2|c2_deny|botnet|c2-data-exfil|c2\s+botnet)', 
     "C2_BOTNET_COMMUNICATION", "SECURITY", "CRITICAL", "DROP"),

    (r'(?i)(attachrolepolicy|authorizesecuritygroupingress|privilege_escalation|sedebugprivilege|role_changed_to_admin|setuid|sudo:\s+\S+\s+:\s+TTY)', 
     "PRIVILEGE_ESCALATION", "SECURITY", "CRITICAL", "ALERT"),

    (r'(?i)(powershell\.exe.*-enc|obfuscated\s+powershell|powershell.*hidden)', 
     "OBFUSCATED_POWERSHELL", "SECURITY", "HIGH", "ALERT"),

    (r'(?i)(\.\./\.\./\.\./|/etc/passwd|directory\s+traversal)', 
     "DIRECTORY_TRAVERSAL", "SECURITY", "HIGH", "BLOCK"),

    (r'(?i)(<script>|alert\(|xss_probe|stored\s+xss)', 
     "XSS_ATTACK_DETECTED", "SECURITY", "HIGH", "BLOCK"),

    (r'(?i)(csrf\s+token\s+validation\s+failed|origin\s+header\s+mismatch|csrf_fail)', 
     "CSRF_ATTACK_DETECTED", "SECURITY", "HIGH", "BLOCK"),

    (r'(?i)(failed password.*root|brute_force|password\s+spray|eventid=4625)', 
     "SSH_BRUTE_FORCE", "SECURITY", "HIGH", "DENY"),

    (r'(?i)(port_scan|syn_scan|syn_sweep|reconnaissance|portscan|probed\s+ports)', 
     "PORT_SCAN_RECON", "SECURITY", "HIGH", "ALERT"),

    (r'(?i)(out of memory:\s*kill|oomkilled|kernel\s+oom)', 
     "SYSTEM_OOM_KILLER", "SYSTEM", "HIGH", "KILL"),

    (r'(?i)(limiting requests|excess:\s*\d|rate\s+limit\s+exceeded|429\s+too\s+many)', 
     "RATE_LIMIT_EXCEEDED", "NETWORK", "MEDIUM", "DROP"),

    (r'(?i)(failed password|login_fail|auth_failure|invalid credentials|authentication failed|auth_err|bad_password|unauthorized_access|access denied for user)', 
     "AUTHENTICATION_FAILURE", "AUTH", "HIGH", "DENY"),

    # 2. AUTHENTICATION SUCCESS
    (r'(?i)(accepted password|login_success|auth_success|authenticated successfully|user_logged_in|session_started|eventid=4624|consolelogin)', 
     "AUTHENTICATION_SUCCESS", "AUTH", "INFO", "ALLOW"),

    # 3. CONNECTION & TRAFFIC POLICIES
    (r'(?i)(action=deny|connection_blocked|firewall_deny|deny tcp|drop udp|packet_dropped|access_denied|blocked ip)', 
     "CONNECTION_BLOCKED", "NETWORK", "MEDIUM", "DROP"),

    (r'(?i)(action=allow|connection_allowed|firewall_allow|allow tcp|pass udp|connection_established|net_flow|tcp_connect)', 
     "CONNECTION_ALLOWED", "NETWORK", "LOW", "ALLOW"),

    # 4. DATABASE OPERATIONS
    (r'(?i)(select\s+|insert\s+into|update\s+|delete\s+from|db_query|database_transaction|sql_execute)', 
     "DATABASE_OPERATION", "APPLICATION", "LOW", "SUCCESS"),

    # 5. APPLICATION EXCEPTIONS & ERRORS
    (r'(?i)(exception|traceback|error|fatal|nullpointer|timeout|corrupted|crash|5\d{2}\s+internal|502 bad gateway|504 gateway timeout)', 
     "APPLICATION_ERROR", "APPLICATION", "HIGH", "FAILURE"),

    # 6. HTTP & API REQUESTS
    (r'(?i)(get\s+/|post\s+/|put\s+/|delete\s+/|http/1\.|http/2|200 ok|201 created|304 not modified|api_call)', 
     "HTTP_REQUEST", "APPLICATION", "LOW", "ALLOW"),

    # 7. ROUTINE SYSTEM HEARTBEAT & LOGS
    (r'(?i)(health_check|heartbeat|ping|metrics|cron_job|system_status|keepalive|info)', 
     "SYSTEM_HEARTBEAT", "SYSTEM", "LOW", "INFO"),
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

    raw_fields = parsed_data.get("raw_fields") or {}
    level = str(raw_fields.get("level") or raw_fields.get("severity") or "").upper()
    status_code = str(raw_fields.get("status_code") or raw_fields.get("status") or "")

    if format_detected == "MALFORMED_OR_UNKNOWN":
        canonical_event_type = "MALFORMED_LOG"
        category = "SYSTEM"
        severity = "MEDIUM"
        action = "UNKNOWN"
    else:
        # Match against taxonomy map
        matched = False
        for pattern, ev_type, cat, sev, default_act in TAXONOMY_MAP:
            if re.search(pattern, event_raw):
                canonical_event_type = ev_type
                category = cat
                severity = sev
                if action in (None, "UNKNOWN", ""):
                    action = default_act
                matched = True
                break

        # If not matched by regex, infer from level / status code
        if not matched:
            if level in ("ERROR", "CRITICAL", "FATAL") or status_code.startswith("5"):
                canonical_event_type = "APPLICATION_ERROR"
                category = "APPLICATION"
                severity = "HIGH" if level == "ERROR" else "CRITICAL"
                action = "FAILURE"
            elif level == "WARN" or status_code.startswith("4"):
                canonical_event_type = "SYSTEM_WARNING"
                category = "SYSTEM"
                severity = "MEDIUM"
                action = "DENY" if status_code in ("401", "403") else "FAILURE"
            elif status_code.startswith("2") or status_code.startswith("3"):
                canonical_event_type = "HTTP_REQUEST"
                category = "APPLICATION"
                severity = "INFO"
                action = "ALLOW"
            elif level in ("INFO", "DEBUG"):
                canonical_event_type = "SYSTEM_CHATTER"
                category = "SYSTEM"
                severity = "INFO" if level == "INFO" else "LOW"
                action = "ALLOW"

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
