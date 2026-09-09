import re
import json
from typing import Dict, Any, Optional, List

# Regex Patterns for Built-in Formats
# Helper to extract canonical fields from a JSON dictionary
def parse_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    timestamp = (data.get("timestamp") or data.get("time") or data.get("@timestamp") or 
                 data.get("date") or data.get("datetime") or data.get("eventTime") or 
                 (data.get("t") and isinstance(data["t"], dict) and data["t"].get("$date")))
    
    event_raw = (data.get("event") or data.get("message") or data.get("msg") or 
                 data.get("action") or data.get("description") or data.get("eventName") or 
                 (data.get("c") and f"{data.get('c')}: {data.get('msg')}") or str(data))
    
    src_ip = (data.get("src_ip") or data.get("source_ip") or data.get("ip") or 
              data.get("client_ip") or data.get("remote_addr") or data.get("src") or 
              data.get("clientIp") or data.get("sourceIPAddress") or 
              (data.get("attr") and isinstance(data["attr"], dict) and data["attr"].get("client")))
    
    dst_ip = (data.get("dst_ip") or data.get("dest_ip") or data.get("destination_ip") or 
              data.get("server_ip") or data.get("dst") or data.get("serverIp"))
    
    src_port = data.get("src_port") or data.get("source_port") or data.get("srcPort")
    dst_port = data.get("dst_port") or data.get("dest_port") or data.get("port") or data.get("dstPort")
    
    user = (data.get("user") or data.get("username") or data.get("account") or 
            data.get("user_id") or data.get("userId") or data.get("admin") or 
            data.get("userName") or 
            (data.get("attr") and isinstance(data["attr"], dict) and data["attr"].get("user")))
    
    hostname = data.get("hostname") or data.get("host") or data.get("server") or data.get("node") or data.get("pod")
    service = data.get("service") or data.get("app") or data.get("process") or data.get("logger") or data.get("component") or data.get("namespace")
    action = data.get("action") or data.get("status") or data.get("result") or data.get("method") or data.get("eventName")
    protocol = data.get("protocol") or data.get("proto") or data.get("scheme")
    bytes_sent = data.get("bytes_sent") or data.get("sent_bytes") or data.get("bytesSent") or 0
    bytes_received = data.get("bytes_received") or data.get("recv_bytes") or data.get("bytesReceived") or 0
    
    return {
        "format": "JSON_LINES",
        "raw_fields": data,
        "timestamp": timestamp,
        "event_raw": event_raw,
        "src_ip": str(src_ip) if src_ip is not None else None,
        "dst_ip": str(dst_ip) if dst_ip is not None else None,
        "src_port": src_port,
        "dst_port": dst_port,
        "user": str(user) if user is not None else None,
        "hostname": str(hostname) if hostname is not None else None,
        "service": str(service) if service is not None else None,
        "action": str(action) if action is not None else None,
        "protocol": str(protocol) if protocol is not None else None,
        "bytes_sent": bytes_sent,
        "bytes_received": bytes_received,
    }

# 1. JSON Lines
def parse_json_lines(raw_text: str) -> Optional[Dict[str, Any]]:
    clean = raw_text.strip()
    if clean.endswith(","):
        clean = clean[:-1].strip()
    if not (clean.startswith('{') and clean.endswith('}')):
        return None
    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            return parse_dict(data)
    except Exception:
        return None
    return None

# 2. Key-Value Pipe Format
# Example: 2026-08-22T10:31:05Z | AUTH_FAILURE | user=admin | ip=192.168.1.100 | port=22 | action=block
KV_PIPE_REGEX = re.compile(
    r'^(?P<timestamp>[\d\-T:\.Z]+)\s*\|\s*(?P<event_raw>[A-Z0-9_\-]+)\s*\|\s*(?P<kv_pairs>.+)$'
)

def parse_kv_pipe(raw_text: str) -> Optional[Dict[str, Any]]:
    match = KV_PIPE_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    kv_str = gd.get("kv_pairs", "")
    kvs = {}
    for part in kv_str.split("|"):
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            kvs[k.strip().lower()] = v.strip()
    
    return {
        "format": "KV_PIPE",
        "raw_fields": kvs,
        "timestamp": gd.get("timestamp"),
        "event_raw": gd.get("event_raw"),
        "src_ip": kvs.get("ip") or kvs.get("src_ip") or kvs.get("source_ip"),
        "dst_ip": kvs.get("dst_ip") or kvs.get("dest_ip"),
        "src_port": kvs.get("src_port"),
        "dst_port": kvs.get("port") or kvs.get("dst_port"),
        "user": kvs.get("user") or kvs.get("username"),
        "hostname": kvs.get("host") or kvs.get("hostname"),
        "service": kvs.get("service") or kvs.get("app"),
        "action": kvs.get("action") or kvs.get("status"),
        "protocol": kvs.get("protocol") or kvs.get("proto"),
        "bytes_sent": kvs.get("bytes_sent", 0),
        "bytes_received": kvs.get("bytes_received", 0),
    }

# 3. Apache / NCSA Common & Combined Log Format
# Example: 192.168.1.105 - - [08/Sep/2026:16:59:00 +0000] "GET /api/v1/users HTTP/1.1" 200 1450
NCSA_REGEX = re.compile(
    r'^(?P<src_ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+\S+\s+(?P<user>\S+)\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+(?P<path>[^\s"]+)(?:\s+(?P<protocol>HTTP/[0-9\.]+))?"\s+(?P<status>\d{3})\s+(?P<size>\d+|-)'
)

def parse_ncsa_apache(raw_text: str) -> Optional[Dict[str, Any]]:
    match = NCSA_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    user_val = gd.get("user")
    user = user_val if user_val and user_val != "-" else None
    
    return {
        "format": "NCSA_CLF",
        "raw_fields": {
            "method": gd.get("method"),
            "path": gd.get("path"),
            "status_code": int(gd.get("status", 200)),
            "size_bytes": int(gd.get("size")) if gd.get("size", "-") != "-" else 0
        },
        "timestamp": gd.get("timestamp"),
        "event_raw": f'{gd.get("method")} {gd.get("path")} ({gd.get("status")})',
        "src_ip": gd.get("src_ip"),
        "dst_ip": None,
        "src_port": None,
        "dst_port": 80 if gd.get("protocol") == "HTTP/1.1" else 443,
        "user": user,
        "hostname": "apache-web01",
        "service": "apache",
        "action": gd.get("method"),
        "protocol": gd.get("protocol", "HTTP/1.1"),
        "bytes_sent": int(gd.get("size")) if gd.get("size", "-") != "-" else 0,
        "bytes_received": 0,
    }

# 4. Windows Event Log (Key-Value pair)
# Example: 2026-09-08 16:59:00 EventID=4625 Level=Warning Computer=DC01.NEXORA.LOCAL User=root Workstation=WS-12 IP=10.0.4.22 Status=0xC000006D
WIN_EVENT_REGEX = re.compile(
    r'^(?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(?P<kvs>EventID=\d+.*)$'
)

def parse_windows_event(raw_text: str) -> Optional[Dict[str, Any]]:
    match = WIN_EVENT_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    kvs_raw = gd.get("kvs", "")
    kvs = {}
    for item in re.finditer(r'(\w+)=([^\s]+)', kvs_raw):
        kvs[item.group(1).lower()] = item.group(2)
        
    eid = kvs.get("eventid", "")
    return {
        "format": "WINDOWS_EVENT",
        "raw_fields": kvs,
        "timestamp": gd.get("timestamp"),
        "event_raw": f"EventID={eid} ({kvs.get('level', 'Info')}) Computer={kvs.get('computer', '')}",
        "src_ip": kvs.get("ip"),
        "dst_ip": None,
        "src_port": None,
        "dst_port": None,
        "user": kvs.get("user"),
        "hostname": kvs.get("computer") or kvs.get("workstation"),
        "service": "Security",
        "action": "DENY" if eid == "4625" else "ALLOW",
        "protocol": "Kerberos",
        "bytes_sent": 0,
        "bytes_received": 0,
    }

# 5. Generic Key-Value Log (e.g. Firewall: timestamp=... action=DENY src_ip=... dst_ip=... port=443 proto=TCP)
KV_SPACE_REGEX = re.compile(
    r'^(?:timestamp=(?P<timestamp>[^\s]+)\s+)?action=(?P<action>[A-Za-z]+)\s+(?P<rest>.*)$'
)

def parse_key_value(raw_text: str) -> Optional[Dict[str, Any]]:
    match = KV_SPACE_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    rest = gd.get("rest", "")
    kvs = {"action": gd.get("action")}
    for item in re.finditer(r'(\w+)=([^\s]+)', rest):
        kvs[item.group(1).lower()] = item.group(2)

    threat_tag = kvs.get("threat_intel") or kvs.get("reason") or ""
    return {
        "format": "KEY_VALUE",
        "raw_fields": kvs,
        "timestamp": gd.get("timestamp") or kvs.get("timestamp"),
        "event_raw": f"Firewall Rule: {gd.get('action')} {kvs.get('proto', 'IP')} {kvs.get('src_ip', '')}:{kvs.get('port', '')} {threat_tag}".strip(),
        "src_ip": kvs.get("src_ip") or kvs.get("src"),
        "dst_ip": kvs.get("dst_ip") or kvs.get("dst"),
        "src_port": None,
        "dst_port": int(kvs.get("port")) if kvs.get("port", "").isdigit() else None,
        "user": kvs.get("user"),
        "hostname": kvs.get("host") or "perimeter-fw01",
        "service": "firewall",
        "action": gd.get("action").upper(),
        "protocol": kvs.get("proto", "TCP").upper(),
        "bytes_sent": int(kvs.get("bytes_sent", 0)),
        "bytes_received": int(kvs.get("bytes_received", 0)),
    }

# 6. Database & Bracketed Server Logs (MySQL, Postgres, Spring, EDR, Web App)
# Example 1: 2026-09-08T16:59:00Z [ERROR] Access denied for user 'root'@'198.51.100.4'
# Example 2: 2026-09-08 16:59:00 [ALERT] EDR Agent: Mimikatz credential dumping ... IP=10.0.4.22
# Example 3: [08/Sep/2026:16:59:00 +0000] [ERROR] [client 192.168.1.105] CSRF token validation failed
# Example 4: [CUSTOM] 2026-09-08 16:59:00 | TRACE_ID=tx_123 | EVENT=StockAllocationFailed | USER=admin
def parse_db_and_bracketed(raw_text: str) -> Optional[Dict[str, Any]]:
    # Custom pipe: [CUSTOM] ...
    if raw_text.startswith("[CUSTOM]"):
        parts = [p.strip() for p in raw_text.replace("[CUSTOM]", "").split("|")]
        ts = parts[0] if len(parts) > 0 else None
        kvs = {}
        for p in parts[1:]:
            if "=" in p:
                k, v = p.split("=", 1)
                kvs[k.strip().lower()] = v.strip()
        return {
            "format": "CUSTOM_APP",
            "raw_fields": kvs,
            "timestamp": ts,
            "event_raw": kvs.get("event", "Custom Transaction"),
            "src_ip": kvs.get("ip") or kvs.get("src_ip"),
            "dst_ip": None,
            "src_port": None,
            "dst_port": None,
            "user": kvs.get("user"),
            "hostname": "core-banking-srv01",
            "service": kvs.get("component", "OrderEngine"),
            "action": kvs.get("event", "TRANSACTION"),
            "protocol": "CUSTOM_RPC",
            "bytes_sent": 0,
            "bytes_received": 0
        }

    # Bracketed / Tagged: 2026-09-08 ... [TAG] ...
    bracket_match = re.search(r'^(?:(?P<ts>[\d\-T:\.Z\s]+)\s+)?\[(?P<level>[A-Za-z0-9_\-]+)\]\s*(?P<msg>.*)$', raw_text)
    if bracket_match:
        bg = bracket_match.groupdict()
        msg = bg.get("msg", "")
        level = bg.get("level", "INFO")
        
        # Extract IP
        ip_match = re.search(r'(?:client|user|host|IP[=:]\s*|\s)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', raw_text)
        src_ip = ip_match.group(1) if ip_match else None
        
        # Extract user
        user_match = re.search(r"user\s+['\"]?([a-zA-Z0-9_\-]+)['\"]?|User=([a-zA-Z0-9_\-]+)", raw_text, re.IGNORECASE)
        user = (user_match.group(1) or user_match.group(2)) if user_match else None
        
        # Determine service
        service = "database" if "access denied" in msg.lower() or "mysql" in raw_text.lower() or "table" in msg.lower() else (
            "EDR Security" if "edr" in msg.lower() or "mimikatz" in msg.lower() or "powershell" in msg.lower() else (
                "PaymentGateway" if "payment" in msg.lower() else "app_server"
            )
        )

        return {
            "format": "BRACKETED_LOG",
            "raw_fields": {"level": level, "message": msg},
            "timestamp": bg.get("ts"),
            "event_raw": msg,
            "src_ip": src_ip,
            "dst_ip": None,
            "src_port": None,
            "dst_port": 3306 if "mysql" in raw_text.lower() else (5432 if "postgres" in raw_text.lower() else None),
            "user": user,
            "hostname": "db-prod01" if "database" in service else "srv-app01",
            "service": service,
            "action": "DENY" if level in ("ERROR", "ALERT", "CRIT") or "denied" in msg.lower() else "INFO",
            "protocol": "SQL" if "database" in service else "RPC",
            "bytes_sent": 0,
            "bytes_received": 0
        }
    return None

# 7. Bracketed Shorthand Format
# Example: [2026-08-22T10:31:08Z] LOGIN_FAIL user=admin ip=192.168.1.100 action=DENY host=fw-01
BRACKETED_REGEX = re.compile(
    r'^\[(?P<timestamp>[^\]]+)\]\s+(?P<event_raw>[A-Z0-9_\-]+)\s*(?P<kv_pairs>.*)$'
)

def parse_bracketed(raw_text: str) -> Optional[Dict[str, Any]]:
    match = BRACKETED_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    kv_str = gd.get("kv_pairs", "")
    kvs = {}
    for item in re.findall(r'(\w+)=([^\s]+)', kv_str):
        kvs[item[0].lower()] = item[1]
        
    return {
        "format": "BRACKETED",
        "raw_fields": kvs,
        "timestamp": gd.get("timestamp"),
        "event_raw": gd.get("event_raw"),
        "src_ip": kvs.get("ip") or kvs.get("src_ip"),
        "dst_ip": kvs.get("dst_ip") or kvs.get("dest_ip"),
        "src_port": kvs.get("src_port"),
        "dst_port": kvs.get("port") or kvs.get("dst_port"),
        "user": kvs.get("user") or kvs.get("username"),
        "hostname": kvs.get("host") or kvs.get("hostname"),
        "service": kvs.get("service"),
        "action": kvs.get("action"),
        "protocol": kvs.get("protocol") or kvs.get("proto"),
        "bytes_sent": kvs.get("bytes_sent", 0),
        "bytes_received": kvs.get("bytes_received", 0),
    }

# 8. Classic & Cisco Syslog Format (RFC 3164 / RFC 5424)
# Example: Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2
# Example 2: <134>Sep 08 16:59:00 cisco-core-sw01 %LINK-3-UPDOWN: Interface GigabitEthernet0/12, changed state to down
SYSLOG_REGEX = re.compile(
    r'^(?:<(?P<pri>\d+)>)?(?P<timestamp>(?:[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})|(?:[\d\-T:\.Z]+))\s+'
    r'(?P<hostname>[\w\.\-]+)\s+'
    r'(?P<service>[\w\.\-%]+)(?:\[(?P<pid>\d+)\])?:\s+'
    r'(?P<message>.*)$'
)

def parse_syslog(raw_text: str) -> Optional[Dict[str, Any]]:
    match = SYSLOG_REGEX.match(raw_text)
    if not match:
        return None
    gd = match.groupdict()
    msg = gd.get("message", "")
    
    # Extract IP address if present in message
    src_ip = None
    ip_match = re.search(r'(?:from|src=|\s)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', msg)
    if ip_match:
        src_ip = ip_match.group(1)
        
    # Extract destination IP if present
    dst_ip = None
    dst_match = re.search(r'(?:to|dst=|->\s*)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', msg)
    if dst_match:
        dst_ip = dst_match.group(1)
        
    # Extract user if present
    user = None
    user_match = re.search(r'(?:for\s+(?:invalid\s+)?user\s+|user\s+|=|for\s+)([a-zA-Z0-9_\-]+)', msg)
    if user_match:
        u_val = user_match.group(1)
        if u_val.lower() not in ("invalid", "failed", "accepted"):
            user = u_val
        else:
            sub_match = re.search(r'user\s+([a-zA-Z0-9_\-]+)', msg)
            if sub_match:
                user = sub_match.group(1)
        
    # Extract port if present
    port = None
    port_match = re.search(r'port\s+(\d+)', msg)
    if port_match:
        port = port_match.group(1)

    return {
        "format": "SYSLOG",
        "raw_fields": {"message": msg, "pid": gd.get("pid")},
        "timestamp": gd.get("timestamp"),
        "event_raw": msg,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": None,
        "dst_port": port,
        "user": user,
        "hostname": gd.get("hostname"),
        "service": gd.get("service"),
        "process_id": int(gd.get("pid")) if gd.get("pid") else None,
        "action": "DENY" if "failed" in msg.lower() or "deny" in msg.lower() or "invalid" in msg.lower() else "ALLOW",
        "protocol": "SSH" if "ssh" in gd.get("service", "").lower() else "SYSLOG",
        "bytes_sent": 0,
        "bytes_received": 0,
    }

# 9. Config Plugin Parser Engine
def parse_with_plugin(raw_text: str, plugins: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for plugin in plugins:
        try:
            pattern = plugin.get("pattern")
            if not pattern:
                continue
            regex = re.compile(pattern)
            match = regex.match(raw_text)
            if match:
                gd = match.groupdict()
                mappings = plugin.get("field_mappings", {})
                
                parsed = {
                    "format": plugin.get("name", "CUSTOM_CONFIG"),
                    "raw_fields": gd,
                    "timestamp": gd.get(mappings.get("timestamp", "timestamp")),
                    "event_raw": gd.get(mappings.get("event_raw", "event")),
                    "src_ip": gd.get(mappings.get("src_ip", "src_ip")),
                    "dst_ip": gd.get(mappings.get("dst_ip", "dst_ip")),
                    "src_port": gd.get(mappings.get("src_port", "src_port")),
                    "dst_port": gd.get(mappings.get("dst_port", "dst_port")),
                    "user": gd.get(mappings.get("user", "user")),
                    "hostname": gd.get(mappings.get("hostname", "hostname")),
                    "service": gd.get(mappings.get("service", "service")),
                    "action": gd.get(mappings.get("action", "action")),
                    "protocol": gd.get(mappings.get("protocol", "protocol")),
                    "bytes_sent": gd.get(mappings.get("bytes_sent", "bytes_sent"), 0),
                    "bytes_received": gd.get(mappings.get("bytes_received", "bytes_received"), 0),
                }
                return parsed
        except Exception:
            continue
    return None


def parse_raw_log(raw_input: Any, custom_plugins: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Stage 2: Multi-Format Parser
    Tries formats in order of specificity:
    1. Dict (pre-parsed JSON)
    2. JSON Lines
    3. NCSA Apache / Common Log Format
    4. Windows EventLog
    5. Key-Value Space (Firewall)
    6. Database & Bracketed Server Logs (MySQL, Postgres, Spring, EDR, Web App)
    7. Key-Value Pipe
    8. Bracketed Shorthand
    9. Custom Plugin Regex Configs
    10. Classic & Cisco Syslog
    11. Fallback Generic Log with extracted tokens
    """
    if isinstance(raw_input, dict):
        return parse_dict(raw_input)

    raw_text = str(raw_input or "")
    text = raw_text.strip()
    
    # 1. Try JSON
    res = parse_json_lines(text)
    if res:
        return res

    # 2. Try NCSA Apache
    res = parse_ncsa_apache(text)
    if res:
        return res

    # 3. Try Windows EventLog
    res = parse_windows_event(text)
    if res:
        return res

    # 4. Try Key-Value Space (Firewall)
    res = parse_key_value(text)
    if res:
        return res

    # 5. Try Database & Bracketed Server Logs
    res = parse_db_and_bracketed(text)
    if res:
        return res

    # 6. Try KV Pipe
    res = parse_kv_pipe(text)
    if res:
        return res
        
    # 7. Try Bracketed Shorthand
    res = parse_bracketed(text)
    if res:
        return res

    # 8. Try Custom Plugins if provided
    if custom_plugins:
        res = parse_with_plugin(text, custom_plugins)
        if res:
            return res
            
    # 9. Try Classic & Cisco Syslog
    res = parse_syslog(text)
    if res:
        return res

    # Extract any IPv4 address found in the line
    ip_match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', text)
    src_ip = ip_match.group(1) if ip_match else None

    # Extract any user found in line
    user_match = re.search(r'(?:user|user_id|User|client)[=:\s]+([a-zA-Z0-9_\-]+)', text)
    user = user_match.group(1) if user_match else None

    # 10. Fallback for Unrecognized / Malformed Log Formats (Lossless, never crashes)
    return {
        "format": "MALFORMED_OR_UNKNOWN",
        "raw_fields": {"unparsed_text": text},
        "timestamp": None,
        "event_raw": text,
        "src_ip": src_ip,
        "dst_ip": None,
        "src_port": None,
        "dst_port": None,
        "user": user,
        "hostname": "gateway-edge",
        "service": "stream",
        "action": "STREAM",
        "protocol": None,
        "bytes_sent": 0,
        "bytes_received": 0,
    }

