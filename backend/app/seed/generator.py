import json
import random
from datetime import datetime, timezone, timedelta
from typing import List

# Core Template Seeds for Reference
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

    # --- Routine Normal Traffic ---
    "Aug 22 10:00:00 nexora-fw-01 syslogd[401]: connection_allowed TCP 10.0.1.15:52100 -> 10.0.0.10:443",
    "Aug 22 10:00:05 nexora-fw-01 syslogd[401]: connection_allowed TCP 10.0.1.15:52100 -> 10.0.0.10:443",
    "2026-08-22T10:05:00Z | LOGIN_SUCCESS | user=alice | ip=10.0.1.50 | port=443 | action=allow | host=nexora-vpn-gw",
    "2026-08-22T10:06:00Z | LOGIN_SUCCESS | user=bob | ip=10.0.1.51 | port=443 | action=allow | host=nexora-vpn-gw",
    "[10:10:00] SYSTEM_CHATTER service=healthcheck host=nexora-fw-01 action=ALLOW ip=10.0.0.1",
    "[10:10:30] SYSTEM_CHATTER service=healthcheck host=nexora-fw-01 action=ALLOW ip=10.0.0.1",
    '{"timestamp": "2026-08-22T10:12:00Z", "event": "connection_allowed", "src_ip": "10.0.2.10", "dst_ip": "10.0.0.50", "dst_port": 80, "user": "charlie", "action": "allow", "protocol": "HTTP", "hostname": "web-server-01"}',
    '{"timestamp": "2026-08-22T10:14:00Z", "event": "connection_allowed", "src_ip": "10.0.2.11", "dst_ip": "10.0.0.50", "dst_port": 80, "user": "david", "action": "allow", "protocol": "HTTP", "hostname": "web-server-01"}'
]


def generate_enterprise_calibrated_logs(total_logs: int = 2400) -> str:
    """
    Generates a realistic enterprise perimeter security log stream calibrated to achieve
    90% - 95% volume deduplication reduction (industry standard for SIEM log intelligence).
    
    Structure:
    - 92-94% high-frequency repetitive chatter (firewall allow streams, health checks, heartbeats within 60s windows)
    - 6-8% distinct unique events (varied IP addresses, diverse endpoints, user logins, and multi-stage attack chains)
    """
    base_time = datetime(2026, 8, 24, 10, 0, 0, tzinfo=timezone.utc)
    
    # 1. Background high-frequency repetitive chatter streams (4 continuous services pulsing every 2 seconds)
    chatter_count = int(total_logs * 0.93)
    chatter_streams = []
    for sec in range(0, chatter_count * 2, 2):
        t = base_time + timedelta(seconds=sec)
        ch_type = sec % 4
        if ch_type == 0:
            chatter_streams.append((t, f'Aug 24 {t.strftime("%H:%M:%S")} nexora-fw-01 syslogd[401]: connection_allowed TCP 10.0.1.15:52100 -> 10.0.0.10:443'))
        elif ch_type == 1:
            chatter_streams.append((t, f'{t.strftime("%Y-%m-%dT%H:%M:%SZ")} | LOGIN_SUCCESS | user=alice | ip=10.0.1.50 | port=443 | action=allow | host=nexora-vpn-gw'))
        elif ch_type == 2:
            chatter_streams.append((t, f'[{t.strftime("%H:%M:%S")}] SYSTEM_CHATTER service=healthcheck host=nexora-fw-01 action=ALLOW ip=10.0.0.1'))
        else:
            chatter_streams.append((t, json.dumps({
                "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "event": "connection_allowed",
                "src_ip": "10.0.2.10",
                "dst_ip": "10.0.0.50",
                "dst_port": 80,
                "user": "charlie",
                "action": "allow",
                "protocol": "HTTP",
                "hostname": "web-server-01"
            })))

    # 2. Distinct normal enterprise operations (diverse employees, IPs, hosts, and protocols across timeline)
    distinct_normal = []
    for host_id in range(1, 140):
        t = base_time + timedelta(seconds=host_id * 32)
        ip = f'10.0.{host_id // 254}.{(host_id % 254) + 1}'
        user = f'employee_{host_id}'
        mod = host_id % 4
        if mod == 0:
            distinct_normal.append((t, f'Aug 24 {t.strftime("%H:%M:%S")} nexora-fw-01 syslogd[401]: connection_allowed TCP {ip}:{40000+host_id} -> 10.0.0.10:443'))
        elif mod == 1:
            distinct_normal.append((t, f'{t.strftime("%Y-%m-%dT%H:%M:%SZ")} | LOGIN_SUCCESS | user={user} | ip={ip} | port=443 | action=allow | host=nexora-vpn-gw'))
        elif mod == 2:
            distinct_normal.append((t, f'[{t.strftime("%H:%M:%S")}] SYSTEM_CHATTER service=healthcheck host=nexora-app-{host_id:03d} action=ALLOW ip={ip}'))
        else:
            distinct_normal.append((t, json.dumps({
                "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "event": "connection_allowed",
                "src_ip": ip,
                "dst_ip": "10.0.0.50",
                "dst_port": 80,
                "user": user,
                "action": "allow",
                "protocol": "HTTP",
                "hostname": f"web-srv-{host_id:03d}"
            })))

    # 3. Multi-Stage Attack Scenarios (Security threats & anomalous activity)
    attack_events = []
    
    # Attack 1: SSH Brute force campaign (192.168.1.105)
    for i in range(8):
        t = base_time + timedelta(minutes=15, seconds=i*3)
        u = 'admin' if i < 3 else ('root' if i < 6 else 'deploy')
        attack_events.append((t, f'Aug 24 {t.strftime("%H:%M:%S")} nexora-fw-01 sshd[{1020+i}]: Failed password for invalid user {u} from 192.168.1.105 port {49150+i*2} ssh2'))
        
    # Attack 2: Multi-stage intrusion chain (10.0.4.22)
    for i in range(4):
        t = base_time + timedelta(minutes=25, seconds=i*3)
        attack_events.append((t, f'{t.strftime("%Y-%m-%dT%H:%M:%SZ")} | AUTH_FAILURE | user=sysadmin | ip=10.0.4.22 | port=22 | action=block | service=sshd | host=nexora-vpn-gw'))
    t_succ = base_time + timedelta(minutes=25, seconds=15)
    attack_events.append((t_succ, f'{t_succ.strftime("%Y-%m-%dT%H:%M:%SZ")} | AUTH_SUCCESS | user=sysadmin | ip=10.0.4.22 | port=22 | action=allow | service=sshd | host=nexora-vpn-gw'))
    t_priv = base_time + timedelta(minutes=25, seconds=20)
    attack_events.append((t_priv, f'Aug 24 {t_priv.strftime("%H:%M:%S")} nexora-app-02 sudo[4412]: pam_unix(sudo:session): session opened for user root by sysadmin(uid=1001)'))
    
    # Attack 3: Network Reconnaissance & Port Scan (172.16.0.88 across 8 target ports)
    ports = [21, 22, 80, 443, 3306, 5432, 8080, 8443]
    for idx, p in enumerate(ports):
        t = base_time + timedelta(minutes=35, seconds=idx*2)
        attack_events.append((t, f'[{t.strftime("%H:%M:%S")}] SYN_SCAN user=unknown ip=172.16.0.88 port={p} action=DENY host=nexora-router-main protocol=TCP'))
        
    # Attack 4: Unauthorized API endpoint traversal (198.51.100.4)
    for i in range(4):
        t = base_time + timedelta(minutes=45, seconds=i*2)
        attack_events.append((t, json.dumps({
            "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "event": "UNAUTHORIZED_ACCESS",
            "src_ip": "198.51.100.4",
            "dst_ip": "10.0.0.5",
            "dst_port": 443,
            "user": "anonymous",
            "action": "block",
            "protocol": "HTTP",
            "hostname": "api-gateway"
        })))

    # Deliberately Corrupted / Malformed Lines
    t_mal1 = base_time + timedelta(minutes=50)
    attack_events.append((t_mal1, "CORRUPTED_RAW_STREAM_GARBAGE_###___!!!&&& 999.999.999.999 [NULL]"))
    t_mal2 = base_time + timedelta(minutes=51)
    attack_events.append((t_mal2, "--- INVALID HEADER NO TIMESTAMP OR SERVICE ---"))

    # Combine all events and sort chronologically
    all_events = chatter_streams + distinct_normal + attack_events
    all_events.sort(key=lambda x: x[0])
    raw_lines = [x[1] for x in all_events]

    return "\n".join(raw_lines)


def get_nexora_seed_logs() -> str:
    """
    Returns the synthetic Nexora Technologies log dataset formatted as a newline-separated log stream.
    Generates a realistic enterprise stream calibrated to standard 90% - 95% SIEM volume reduction.
    """
    return generate_enterprise_calibrated_logs(total_logs=2400)

