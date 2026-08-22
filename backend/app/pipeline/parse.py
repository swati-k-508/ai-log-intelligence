import re
import json
from typing import Dict, Any, Optional, List

# Regex Patterns for Built-in Formats
# 1. JSON Lines
def parse_json_lines(raw_text: str) -> Optional[Dict[str, Any]]:
    if not (raw_text.startswith('{') and raw_text.endswith('}')):
        return None
    try:
        data = json.loads(raw_text)
        if isinstance(data, dict):
            return {
                "format": "JSON_LINES",
                "raw_fields": data,
                "timestamp": data.get("timestamp") or data.get("time") or data.get("@timestamp"),
                "event_raw": data.get("event") or data.get("message") or data.get("msg") or data.get("action"),
                "src_ip": data.get("src_ip") or data.get("source_ip") or data.get("ip") or data.get("client_ip"),
                "dst_ip": data.get("dst_ip") or data.get("dest_ip") or data.get("destination_ip") or data.get("server_ip"),
                "src_port": data.get("src_port") or data.get("source_port"),
                "dst_port": data.get("dst_port") or data.get("dest_port") or data.get("port"),
                "user": data.get("user") or data.get("username") or data.get("account"),
                "hostname": data.get("hostname") or data.get("host"),
                "service": data.get("service") or data.get("app") or data.get("process"),
                "action": data.get("action") or data.get("status"),
                "protocol": data.get("protocol") or data.get("proto"),
                "bytes_sent": data.get("bytes_sent") or data.get("sent_bytes") or 0,
                "bytes_received": data.get("bytes_received") or data.get("recv_bytes") or 0,
            }
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

# 3. Bracketed Shorthand Format
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
    # Extract k=v pairs from space separated string
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

# 4. Classic Syslog Format (RFC 3164 / RFC 5424)
# Example: Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2
# Example 2: 2026-08-22T10:31:04Z host firewall[882]: DENY TCP 192.168.1.50:443 -> 10.0.0.5:80
SYSLOG_REGEX = re.compile(
    r'^(?P<timestamp>(?:[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})|(?:[\d\-T:\.Z]+))\s+'
    r'(?P<hostname>[\w\.\-]+)\s+'
    r'(?P<service>[\w\.\-]+)(?:\[(?P<pid>\d+)\])?:\s+'
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
        
    # Extract user if present (handles 'for invalid user admin', 'user=admin', 'for admin')
    user = None
    user_match = re.search(r'(?:for\s+(?:invalid\s+)?user\s+|user\s+|=|for\s+)([a-zA-Z0-9_\-]+)', msg)
    if user_match:
        u_val = user_match.group(1)
        if u_val.lower() not in ("invalid", "failed", "accepted"):
            user = u_val
        else:
            # fallback try next match
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
        "protocol": "SSH" if "ssh" in gd.get("service", "").lower() else None,
        "bytes_sent": 0,
        "bytes_received": 0,
    }

# 5. Config Plugin Parser Engine
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
                
                # Map extracted regex groups using field_mappings
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


def parse_raw_log(raw_text: str, custom_plugins: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Stage 2: Multi-Format Parser
    Tries formats in order of specificity:
    1. JSON Lines
    2. Key-Value Pipe
    3. Bracketed Shorthand
    4. Custom Plugin Regex Configs
    5. Classic Syslog
    6. Fallback Malformed Log (Never Crashes!)
    """
    text = raw_text.strip()
    
    # 1. Try JSON
    res = parse_json_lines(text)
    if res:
        return res
        
    # 2. Try KV Pipe
    res = parse_kv_pipe(text)
    if res:
        return res
        
    # 3. Try Bracketed Shorthand
    res = parse_bracketed(text)
    if res:
        return res

    # 4. Try Custom Plugins if provided
    if custom_plugins:
        res = parse_with_plugin(text, custom_plugins)
        if res:
            return res
            
    # 5. Try Classic Syslog
    res = parse_syslog(text)
    if res:
        return res

    # 6. Fallback for Malformed / Unrecognized Log Formats
    return {
        "format": "MALFORMED_OR_UNKNOWN",
        "raw_fields": {"unparsed_text": text},
        "timestamp": None,
        "event_raw": text,
        "src_ip": None,
        "dst_ip": None,
        "src_port": None,
        "dst_port": None,
        "user": None,
        "hostname": None,
        "service": None,
        "action": "UNKNOWN",
        "protocol": None,
        "bytes_sent": 0,
        "bytes_received": 0,
    }
