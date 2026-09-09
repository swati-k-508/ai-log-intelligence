import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from ..db.models import NormalizedLog, RawLog, Alert

DEMO_INCIDENT_DATA = {
    "id": "INC-2026-8942",
    "title": "Multi-Stage Credential Abuse & Privilege Escalation",
    "is_demo": True,
    "start_time": "2026-08-23T10:31:02Z",
    "end_time": "2026-08-23T10:32:30Z",
    "duration": "1 min 28 sec",
    "event_count": 11,
    "risk_level": "CRITICAL",
    "risk_score": 94,
    "risk_trajectory": "RAPIDLY INCREASING",
    "affected_entity": "user: sysadmin | host: nexora-vpn-gw",
    "attacker_ip": "198.51.100.4",
    "target_system": "nexora-app-02 / 10.0.0.5",
    "summary": "High-velocity authentication failure cluster followed by successful credential compromise from an anomalous external IP, immediate root privilege escalation, access to sensitive security configuration files, and subsequent large data exfiltration over SFTP.",
    "baseline_vs_during": {
        "before": {
            "failed_logins_per_min": "0.5 / min",
            "source_ip_status": "Internal corporate range (10.0.1.x)",
            "privilege_escalation_events": "0 detected",
            "outbound_transfer_rate": "1.2 KB/min",
            "session_risk_score": "8% (Low)"
        },
        "during": {
            "failed_logins_per_min": "18.0 / min (36x spike)",
            "source_ip_status": "Unrecognized external IP (198.51.100.4)",
            "privilege_escalation_events": "Root session opened via sudo by sysadmin",
            "outbound_transfer_rate": "48.2 MB / 15 sec burst",
            "session_risk_score": "94% (CRITICAL)"
        }
    },
    "correlation_rules": [
        {"from_step": 1, "to_step": 3, "relation": "High Frequency Auth Failures from Same Source IP (198.51.100.4)"},
        {"from_step": 3, "to_step": 4, "relation": "Unusual External IP Anomaly for Protected Account 'sysadmin'"},
        {"from_step": 4, "to_step": 5, "relation": "Successful Login immediately following Brute Force Sequence"},
        {"from_step": 5, "to_step": 6, "relation": "Immediate Privilege Escalation (sudo root) within 18s of login"},
        {"from_step": 6, "to_step": 7, "relation": "Access to Sensitive System File (/etc/shadow) by escalated root session"},
        {"from_step": 7, "to_step": 9, "relation": "Unusual Outbound C2/SFTP Connection initiated to external IP"},
        {"from_step": 9, "to_step": 11, "relation": "Abnormal Data Exfiltration burst (48.2 MB) in short session timeframe"}
    ],
    "key_contributing_factors": [
        "Authentication failure rate spiked 36x above normal baseline within 30 seconds",
        "Successful authentication originated from an unvalidated external IP (198.51.100.4)",
        "Root privilege escalation occurred 18 seconds after initial login",
        "Sensitive system credential store (/etc/shadow) was read by the session",
        "Anomalous 48.2 MB outbound payload transfer executed over SFTP channel"
    ],
    "events": [
        {
            "step_number": 1,
            "id": "EVT-00481",
            "raw_event_id": "RAW-00481",
            "timestamp": "2026-08-23T10:31:02Z",
            "display_time": "10:31:02",
            "event_type": "AUTHENTICATION_FAILURE",
            "category": "AUTH",
            "severity": "HIGH",
            "action": "DENY",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "admin",
            "hostname": "nexora-vpn-gw",
            "service": "sshd",
            "summary": "Authentication failure x 5 for invalid user 'admin'",
            "relevance_reason": "First indicator of automated dictionary attack targeting system accounts from external IP.",
            "risk_score_at_step": 22,
            "normalized_fields": {
                "event_type": "AUTHENTICATION_FAILURE",
                "user": "admin",
                "source_ip": "198.51.100.4",
                "destination_ip": "10.0.0.5",
                "destination_port": 22,
                "protocol": "SSH2",
                "action": "DENY",
                "attempt_count": 5
            },
            "raw_log": "Aug 23 10:31:02 nexora-vpn-gw sshd[4102]: Failed password for invalid user admin from 198.51.100.4 port 51042 ssh2",
            "parser_used": "SyslogSSHDParser v1.2",
            "ml_anomaly_score": 0.74
        },
        {
            "step_number": 2,
            "id": "EVT-00482",
            "raw_event_id": "RAW-00482",
            "timestamp": "2026-08-23T10:31:08Z",
            "display_time": "10:31:08",
            "event_type": "AUTHENTICATION_FAILURE",
            "category": "AUTH",
            "severity": "HIGH",
            "action": "DENY",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "root",
            "hostname": "nexora-vpn-gw",
            "service": "sshd",
            "summary": "Authentication failure x 8 targeting privileged account 'root'",
            "relevance_reason": "Attacker pivoted from generic 'admin' to targeted privileged user 'root' within 6 seconds.",
            "risk_score_at_step": 34,
            "normalized_fields": {
                "event_type": "AUTHENTICATION_FAILURE",
                "user": "root",
                "source_ip": "198.51.100.4",
                "destination_ip": "10.0.0.5",
                "destination_port": 22,
                "protocol": "SSH2",
                "action": "DENY",
                "attempt_count": 8
            },
            "raw_log": "Aug 23 10:31:08 nexora-vpn-gw sshd[4108]: Failed password for invalid user root from 198.51.100.4 port 51046 ssh2",
            "parser_used": "SyslogSSHDParser v1.2",
            "ml_anomaly_score": 0.81
        },
        {
            "step_number": 3,
            "id": "EVT-00483",
            "raw_event_id": "RAW-00483",
            "timestamp": "2026-08-23T10:31:17Z",
            "display_time": "10:31:17",
            "event_type": "ANOMALOUS_IP_DETECTED",
            "category": "SECURITY",
            "severity": "MEDIUM",
            "action": "ALERT",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "sysadmin",
            "hostname": "nexora-vpn-gw",
            "service": "threat-intel",
            "summary": "Unusual IP detected (198.51.100.4) outside allowed corporate subnet",
            "relevance_reason": "ML Pipeline flagged 198.51.100.4 as an unverified ASN without prior session history.",
            "risk_score_at_step": 48,
            "normalized_fields": {
                "event_type": "ANOMALOUS_IP_DETECTED",
                "source_ip": "198.51.100.4",
                "geo_location": "External / Unknown ASN 48219",
                "reputation_score": "88/100 Threat Index",
                "action": "ALERT"
            },
            "raw_log": "2026-08-23T10:31:17Z | ANOMALOUS_IP_DETECTED | ip=198.51.100.4 | asn=48219 | threat_score=88 | host=nexora-vpn-gw",
            "parser_used": "KVFormatter v2.0",
            "ml_anomaly_score": 0.88
        },
        {
            "step_number": 4,
            "id": "EVT-00484",
            "raw_event_id": "RAW-00484",
            "timestamp": "2026-08-23T10:31:25Z",
            "display_time": "10:31:25",
            "event_type": "AUTHENTICATION_FAILURE",
            "category": "AUTH",
            "severity": "HIGH",
            "action": "DENY",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "sysadmin",
            "hostname": "nexora-vpn-gw",
            "service": "sshd",
            "summary": "Authentication failure x 3 for user 'sysadmin'",
            "relevance_reason": "Attacker targeting valid staff user account 'sysadmin' with credential spray.",
            "risk_score_at_step": 58,
            "normalized_fields": {
                "event_type": "AUTHENTICATION_FAILURE",
                "user": "sysadmin",
                "source_ip": "198.51.100.4",
                "destination_ip": "10.0.0.5",
                "destination_port": 22,
                "action": "DENY"
            },
            "raw_log": "2026-08-23T10:31:25Z | AUTH_FAILURE | user=sysadmin | ip=198.51.100.4 | port=22 | action=block | service=sshd | host=nexora-vpn-gw",
            "parser_used": "KVFormatter v2.0",
            "ml_anomaly_score": 0.84
        },
        {
            "step_number": 5,
            "id": "EVT-00485",
            "raw_event_id": "RAW-00485",
            "timestamp": "2026-08-23T10:31:43Z",
            "display_time": "10:31:43",
            "event_type": "AUTHENTICATION_SUCCESS",
            "category": "AUTH",
            "severity": "HIGH",
            "action": "SUCCESS",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "sysadmin",
            "hostname": "nexora-vpn-gw",
            "service": "sshd",
            "summary": "Successful SSH login for user 'sysadmin' from 198.51.100.4",
            "relevance_reason": "CRITICAL TURN: Brute-force sequence succeeded; compromised valid credentials established an active shell.",
            "risk_score_at_step": 67,
            "normalized_fields": {
                "event_type": "AUTHENTICATION_SUCCESS",
                "user": "sysadmin",
                "source_ip": "198.51.100.4",
                "destination_ip": "10.0.0.5",
                "destination_port": 22,
                "protocol": "SSH2",
                "action": "SUCCESS"
            },
            "raw_log": "2026-08-23T10:31:43Z | AUTH_SUCCESS | user=sysadmin | ip=198.51.100.4 | port=22 | action=allow | service=sshd | host=nexora-vpn-gw",
            "parser_used": "KVFormatter v2.0",
            "ml_anomaly_score": 0.89
        },
        {
            "step_number": 6,
            "id": "EVT-00486",
            "raw_event_id": "RAW-00486",
            "timestamp": "2026-08-23T10:32:01Z",
            "display_time": "10:32:01",
            "event_type": "PRIVILEGE_ESCALATION",
            "category": "SECURITY",
            "severity": "CRITICAL",
            "action": "SUCCESS",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "root",
            "hostname": "nexora-app-02",
            "service": "sudo",
            "summary": "Privilege escalation: sudo session opened for root by sysadmin (uid=1001)",
            "relevance_reason": "Attacker executed sudo privilege escalation 18 seconds after gaining initial access.",
            "risk_score_at_step": 82,
            "normalized_fields": {
                "event_type": "PRIVILEGE_ESCALATION",
                "target_user": "root",
                "initiating_user": "sysadmin",
                "uid": 1001,
                "service": "sudo",
                "action": "SUCCESS"
            },
            "raw_log": "Aug 23 10:32:01 nexora-app-02 sudo[4412]: pam_unix(sudo:session): session opened for user root by sysadmin(uid=1001)",
            "parser_used": "SyslogSudoParser v1.0",
            "ml_anomaly_score": 0.95
        },
        {
            "step_number": 7,
            "id": "EVT-00487",
            "raw_event_id": "RAW-00487",
            "timestamp": "2026-08-23T10:32:08Z",
            "display_time": "10:32:08",
            "event_type": "SENSITIVE_RESOURCE_ACCESS",
            "category": "SECURITY",
            "severity": "CRITICAL",
            "action": "ALLOW",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "root",
            "hostname": "nexora-app-02",
            "service": "auditd",
            "summary": "Sensitive resource read access: /etc/shadow and /etc/security/opasswd",
            "relevance_reason": "Escalated root session accessed local password hash databases for offline cracking/reconnaissance.",
            "risk_score_at_step": 88,
            "normalized_fields": {
                "event_type": "SENSITIVE_RESOURCE_ACCESS",
                "resource_path": "/etc/shadow",
                "access_type": "READ",
                "user": "root",
                "process": "cat"
            },
            "raw_log": "Aug 23 10:32:08 nexora-app-02 auditd[1092]: SYSCALL=openat path=/etc/shadow flags=O_RDONLY user=root pid=4419",
            "parser_used": "AuditdLinuxParser v1.1",
            "ml_anomaly_score": 0.96
        },
        {
            "step_number": 8,
            "id": "EVT-00488",
            "raw_event_id": "RAW-00488",
            "timestamp": "2026-08-23T10:32:14Z",
            "display_time": "10:32:14",
            "event_type": "ABNORMAL_NETWORK_CONNECTION",
            "category": "NETWORK",
            "severity": "HIGH",
            "action": "ALLOW",
            "source_ip": "10.0.0.5",
            "destination_ip": "198.51.100.4",
            "user": "root",
            "hostname": "nexora-app-02",
            "service": "sftp",
            "summary": "Abnormal outbound TCP socket connection established to 198.51.100.4:2222",
            "relevance_reason": "Outbound encrypted connection initiated directly back to attacker's infrastructure.",
            "risk_score_at_step": 91,
            "normalized_fields": {
                "event_type": "ABNORMAL_NETWORK_CONNECTION",
                "source_ip": "10.0.0.5",
                "destination_ip": "198.51.100.4",
                "destination_port": 2222,
                "protocol": "TCP/SFTP",
                "action": "ALLOW"
            },
            "raw_log": "2026-08-23T10:32:14Z | OUTBOUND_CONN | src=10.0.0.5:49812 | dst=198.51.100.4:2222 | proto=SFTP | host=nexora-app-02",
            "parser_used": "KVFormatter v2.0",
            "ml_anomaly_score": 0.92
        },
        {
            "step_number": 9,
            "id": "EVT-00489",
            "raw_event_id": "RAW-00489",
            "timestamp": "2026-08-23T10:32:20Z",
            "display_time": "10:32:20",
            "event_type": "LARGE_DATA_TRANSFER",
            "category": "NETWORK",
            "severity": "CRITICAL",
            "action": "ALLOW",
            "source_ip": "10.0.0.5",
            "destination_ip": "198.51.100.4",
            "user": "root",
            "hostname": "nexora-app-02",
            "service": "sftp",
            "summary": "Large data exfiltration stream: 48,291,000 bytes transferred in 6 seconds",
            "relevance_reason": "High-volume data exfiltration burst detected by anomaly pipeline (48.2 MB payload).",
            "risk_score_at_step": 94,
            "normalized_fields": {
                "event_type": "LARGE_DATA_TRANSFER",
                "bytes_sent": 48291000,
                "bytes_received": 14200,
                "protocol": "SFTP",
                "duration_sec": 6,
                "action": "ALLOW"
            },
            "raw_log": "2026-08-23T10:32:20Z | DATA_EXFILTRATION | bytes_sent=48291000 | bytes_recv=14200 | proto=SFTP | dst=198.51.100.4",
            "parser_used": "KVFormatter v2.0",
            "ml_anomaly_score": 0.98
        },
        {
            "step_number": 10,
            "id": "EVT-00490",
            "raw_event_id": "RAW-00490",
            "timestamp": "2026-08-23T10:32:26Z",
            "display_time": "10:32:26",
            "event_type": "LOG_TAMPERING_ATTEMPT",
            "category": "SECURITY",
            "severity": "CRITICAL",
            "action": "ALERT",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "root",
            "hostname": "nexora-app-02",
            "service": "syslog",
            "summary": "Defense evasion: Attempted truncation of /var/log/auth.log detected",
            "relevance_reason": "Attacker attempted anti-forensic log cleanup to cover tracks before disconnecting.",
            "risk_score_at_step": 95,
            "normalized_fields": {
                "event_type": "LOG_TAMPERING_ATTEMPT",
                "target_file": "/var/log/auth.log",
                "action": "ALERT",
                "command": "shred -u -z /var/log/auth.log"
            },
            "raw_log": "Aug 23 10:32:26 nexora-app-02 auditd[1105]: EXECVE cmd=shred args=\"-u -z /var/log/auth.log\" user=root",
            "parser_used": "AuditdLinuxParser v1.1",
            "ml_anomaly_score": 0.97
        },
        {
            "step_number": 11,
            "id": "EVT-00491",
            "raw_event_id": "RAW-00491",
            "timestamp": "2026-08-23T10:32:30Z",
            "display_time": "10:32:30",
            "event_type": "SESSION_TERMINATED",
            "category": "AUTH",
            "severity": "INFO",
            "action": "ALLOW",
            "source_ip": "198.51.100.4",
            "destination_ip": "10.0.0.5",
            "user": "sysadmin",
            "hostname": "nexora-vpn-gw",
            "service": "sshd",
            "summary": "SSH session closed for user 'sysadmin' from 198.51.100.4",
            "relevance_reason": "Final stage: Attacker closed remote shell following exfiltration and log wipe attempt.",
            "risk_score_at_step": 94,
            "normalized_fields": {
                "event_type": "SESSION_TERMINATED",
                "user": "sysadmin",
                "source_ip": "198.51.100.4",
                "action": "ALLOW",
                "duration_sec": 87
            },
            "raw_log": "Aug 23 10:32:30 nexora-vpn-gw sshd[4102]: Received disconnect from 198.51.100.4 port 51042:11: disconnected by user",
            "parser_used": "SyslogSSHDParser v1.2",
            "ml_anomaly_score": 0.50
        }
    ]
}

def get_demo_incident() -> Dict[str, Any]:
    """Returns the pre-packaged reproducible multi-stage breach incident."""
    return DEMO_INCIDENT_DATA

def build_incidents_from_db(db: Session) -> List[Dict[str, Any]]:
    """
    Scans NormalizedLog database records and reconstructs active incident timelines.
    Always includes the Demo Incident so analysts can reliably test replay features.
    """
    incidents = [get_demo_incident()]
    
    # Query database normalized logs
    logs = db.query(NormalizedLog).order_by(NormalizedLog.timestamp.asc()).all()
    if not logs or len(logs) == 0:
        return incidents

    # Group security/anomaly logs by entity (user, source_ip, or hostname)
    groups: Dict[str, List[NormalizedLog]] = {}
    for log in logs:
        # Group key priority: source_ip > user > hostname > 'default'
        key = log.source_ip or log.user or log.hostname or "system"
        if key not in groups:
            groups[key] = []
        groups[key].append(log)

    inc_counter = 1
    for key, group_logs in groups.items():
        if len(group_logs) < 2:
            continue # Need at least 2 events to form a timeline

        events = []
        cumulative_score = 15
        
        for idx, l in enumerate(group_logs, start=1):
            raw_text = ""
            raw_log = db.query(RawLog).filter(RawLog.id == l.raw_event_id).first()
            if raw_log:
                raw_text = raw_log.raw_text

            extracted = {}
            try:
                extracted = json.loads(l.extracted_fields_json) if l.extracted_fields_json else {}
            except Exception:
                pass

            # Calculate step risk based on severity
            sev_boost = 10
            if l.severity == "CRITICAL":
                sev_boost = 25
            elif l.severity == "HIGH":
                sev_boost = 18
            elif l.severity == "MEDIUM":
                sev_boost = 12

            cumulative_score = min(99, cumulative_score + sev_boost)

            events.append({
                "step_number": idx,
                "id": l.id,
                "raw_event_id": l.raw_event_id,
                "timestamp": l.timestamp,
                "display_time": l.timestamp.split("T")[-1].replace("Z", "") if "T" in l.timestamp else l.timestamp,
                "event_type": l.event_type,
                "category": l.category,
                "severity": l.severity,
                "action": l.action,
                "source_ip": l.source_ip or "N/A",
                "destination_ip": l.destination_ip or "N/A",
                "user": l.user or "N/A",
                "hostname": l.hostname or "N/A",
                "service": l.service or "N/A",
                "summary": f"{l.event_type} on {l.hostname or 'host'} by {l.user or l.source_ip or 'entity'}",
                "relevance_reason": f"Correlated event in sequence for entity {key}. Action taken: {l.action}.",
                "risk_score_at_step": cumulative_score,
                "normalized_fields": {
                    "event_type": l.event_type,
                    "category": l.category,
                    "severity": l.severity,
                    "action": l.action,
                    "source_ip": l.source_ip,
                    "destination_ip": l.destination_ip,
                    "user": l.user,
                    "hostname": l.hostname,
                    "format_detected": l.format_detected,
                    **extracted
                },
                "raw_log": raw_text or f"RAW LOG ENTRY FOR {l.id}",
                "parser_used": f"{l.format_detected} Parser",
                "ml_anomaly_score": 0.85 if l.severity in ["HIGH", "CRITICAL"] else 0.45
            })

        max_risk = max([e["risk_score_at_step"] for e in events]) if events else 50
        risk_lvl = "CRITICAL" if max_risk > 80 else ("HIGH" if max_risk > 60 else "MEDIUM")

        incidents.append({
            "id": f"INC-LIVE-00{inc_counter}",
            "title": f"Live Detected Anomaly Cluster ({key})",
            "is_demo": False,
            "start_time": events[0]["timestamp"],
            "end_time": events[-1]["timestamp"],
            "duration": f"{len(events)} correlated steps",
            "event_count": len(events),
            "risk_level": risk_lvl,
            "risk_score": max_risk,
            "risk_trajectory": "ESCALATING" if max_risk > 70 else "MODERATE",
            "affected_entity": f"Entity: {key}",
            "attacker_ip": group_logs[0].source_ip or "N/A",
            "target_system": group_logs[0].hostname or "N/A",
            "summary": f"Automated correlation chain detected {len(events)} security logs associated with entity '{key}'.",
            "baseline_vs_during": {
                "before": {
                    "event_frequency": "Standard baseline",
                    "privilege_changes": "None",
                    "session_risk_score": "15%"
                },
                "during": {
                    "event_frequency": f"{len(events)} correlated events",
                    "privilege_changes": f"Max Severity {risk_lvl}",
                    "session_risk_score": f"{max_risk}% ({risk_lvl})"
                }
            },
            "correlation_rules": [
                {"from_step": i, "to_step": i+1, "relation": f"Sequential activity for entity {key}"}
                for i in range(1, len(events))
            ],
            "key_contributing_factors": [
                f"{len(events)} logs correlated chronologically for entity {key}",
                f"Peak severity reached: {risk_lvl}",
                f"Calculated risk trajectory score: {max_risk}%"
            ],
            "events": events
        })
        inc_counter += 1

    return incidents
