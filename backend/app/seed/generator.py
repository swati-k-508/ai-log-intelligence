import random

NEXORA_RAW_LOGS = [
    # --- Attack Scenario 1: SSH Brute Force (Syslog format) ---
    "Aug 22 10:15:01 nexora-fw-01 sshd[1021]: Failed password for invalid user admin from 192.168.1.105 port 49152 ssh2",
    "Aug 22 10:15:03 nexora-fw-01 sshd[1022]: Failed password for invalid user admin from 192.168.1.105 port 49154 ssh2",
    "Aug 22 10:15:05 nexora-fw-01 sshd[1023]: Failed password for invalid user admin from 192.168.1.105 port 49156 ssh2",
    "Aug 22 10:15:07 nexora-fw-01 sshd[1024]: Failed password for invalid user root from 192.168.1.105 port 49158 ssh2",
    "Aug 22 10:15:09 nexora-fw-01 sshd[1025]: Failed password for invalid user root from 192.168.1.105 port 49160 ssh2",
    "Aug 22 10:15:11 nexora-fw-01 sshd[1026]: Failed password for invalid user deploy from 192.168.1.105 port 49162 ssh2",
    
    # --- Attack Scenario 2: Brute Force -> Auth Success -> Root Escalation (KV Pipe & Syslog) ---
    "2026-08-22T10:20:00Z | AUTH_FAILURE | user=sysadmin | ip=10.0.4.22 | port=22 | action=block | service=sshd | host=nexora-vpn-gw",
    "2026-08-22T10:20:03Z | AUTH_FAILURE | user=sysadmin | ip=10.0.4.22 | port=22 | action=block | service=sshd | host=nexora-vpn-gw",
    "2026-08-22T10:20:06Z | AUTH_FAILURE | user=sysadmin | ip=10.0.4.22 | port=22 | action=block | service=sshd | host=nexora-vpn-gw",
    "2026-08-22T10:20:10Z | AUTH_SUCCESS | user=sysadmin | ip=10.0.4.22 | port=22 | action=allow | service=sshd | host=nexora-vpn-gw",
    "Aug 22 10:20:15 nexora-app-02 sudo[4412]: pam_unix(sudo:session): session opened for user root by sysadmin(uid=1001)",
    
    # --- Attack Scenario 3: Port Scan / Reconnaissance (Bracketed Shorthand format) ---
    "[10:25:01] SYN_SCAN user=unknown ip=172.16.0.88 port=21 action=DENY host=nexora-router-main protocol=TCP",
    "[10:25:02] SYN_SCAN user=unknown ip=172.16.0.88 port=22 action=DENY host=nexora-router-main protocol=TCP",
    "[10:25:03] SYN_SCAN user=unknown ip=172.16.0.88 port=80 action=DENY host=nexora-router-main protocol=TCP",
    "[10:25:04] SYN_SCAN user=unknown ip=172.16.0.88 port=443 action=DENY host=nexora-router-main protocol=TCP",
    "[10:25:05] SYN_SCAN user=unknown ip=172.16.0.88 port=3306 action=DENY host=nexora-router-main protocol=TCP",
    "[10:25:06] SYN_SCAN user=unknown ip=172.16.0.88 port=5432 action=DENY host=nexora-router-main protocol=TCP",

    # --- Attack Scenario 4: Unauthorized Endpoint Access (JSON Lines format) ---
    '{"timestamp": "2026-08-22T10:30:00Z", "event": "UNAUTHORIZED_ACCESS", "src_ip": "198.51.100.4", "dst_ip": "10.0.0.5", "dst_port": 443, "user": "anonymous", "action": "block", "protocol": "HTTP", "hostname": "api-gateway"}',
    '{"timestamp": "2026-08-22T10:30:02Z", "event": "UNAUTHORIZED_ACCESS", "src_ip": "198.51.100.4", "dst_ip": "10.0.0.5", "dst_port": 443, "user": "anonymous", "action": "block", "protocol": "HTTP", "hostname": "api-gateway"}',

    # --- Deliberately Corrupted / Malformed Log Lines ---
    "CORRUPTED_RAW_STREAM_GARBAGE_###___!!!&&& 999.999.999.999 [NULL]",
    "--- INVALID HEADER NO TIMESTAMP OR SERVICE ---",

    # --- Routine Normal Traffic (Deduplication & Noise Filter test) ---
    "Aug 22 10:00:00 nexora-fw-01 syslogd[401]: connection_allowed TCP 10.0.1.15:52100 -> 10.0.0.10:443",
    "Aug 22 10:00:05 nexora-fw-01 syslogd[401]: connection_allowed TCP 10.0.1.15:52100 -> 10.0.0.10:443",
    "2026-08-22T10:05:00Z | LOGIN_SUCCESS | user=alice | ip=10.0.1.50 | port=443 | action=allow | host=nexora-vpn-gw",
    "2026-08-22T10:06:00Z | LOGIN_SUCCESS | user=bob | ip=10.0.1.51 | port=443 | action=allow | host=nexora-vpn-gw",
    "[10:10:00] SYSTEM_CHATTER service=healthcheck host=nexora-fw-01 action=ALLOW ip=10.0.0.1",
    "[10:10:30] SYSTEM_CHATTER service=healthcheck host=nexora-fw-01 action=ALLOW ip=10.0.0.1",
    '{"timestamp": "2026-08-22T10:12:00Z", "event": "connection_allowed", "src_ip": "10.0.2.10", "dst_ip": "10.0.0.50", "dst_port": 80, "user": "charlie", "action": "allow", "protocol": "HTTP", "hostname": "web-server-01"}',
    '{"timestamp": "2026-08-22T10:14:00Z", "event": "connection_allowed", "src_ip": "10.0.2.11", "dst_ip": "10.0.0.50", "dst_port": 80, "user": "david", "action": "allow", "protocol": "HTTP", "hostname": "web-server-01"}'
]

def get_nexora_seed_logs() -> str:
    """
    Returns the synthetic Nexora Technologies log dataset formatted as a newline-separated log stream.
    """
    return "\n".join(NEXORA_RAW_LOGS)
