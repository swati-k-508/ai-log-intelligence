import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import numpy as np
from sklearn.ensemble import IsolationForest

from ..db.models import NormalizedLog, Alert

def run_ml_anomaly_detection(db: Session) -> List[Alert]:
    """
    Stage 6: AI/ML Anomaly Detector & Plain-Language Explainer Engine.
    Combines scikit-learn Isolation Forest ML statistical modeling with sequence rule heuristics.
    Generates structured Alert records with plain-language explanations.
    """
    new_alerts = []

    # Fetch normalized events
    logs = db.query(NormalizedLog).order_by(NormalizedLog.timestamp.asc()).all()
    if not logs:
        return []

    # 1. Feature Extraction per Source IP
    ip_stats = {}
    for log in logs:
        ip = log.source_ip or "0.0.0.0"
        if ip not in ip_stats:
            ip_stats[ip] = {
                "total_count": 0,
                "auth_fails": 0,
                "auth_success": 0,
                "priv_escalations": 0,
                "distinct_ports": set(),
                "users": set(),
                "event_ids": [],
                "first_seen": log.timestamp,
                "last_seen": log.timestamp,
            }
        
        stat = ip_stats[ip]
        stat["total_count"] += log.dup_count
        if len(stat["event_ids"]) < 50:
            stat["event_ids"].append(log.id)
        stat["last_seen"] = log.timestamp

        if log.user:
            stat["users"].add(log.user)
        if log.destination_port:
            stat["distinct_ports"].add(log.destination_port)

        if log.event_type == "AUTHENTICATION_FAILURE":
            stat["auth_fails"] += log.dup_count
        elif log.event_type == "AUTHENTICATION_SUCCESS":
            stat["auth_success"] += log.dup_count
        elif log.event_type == "PRIVILEGE_ESCALATION":
            stat["priv_escalations"] += log.dup_count

    # 2. Sequence Rule Engine
    existing_alert_ips = set(
        a.source_ip for a in db.query(Alert).all() if a.source_ip
    )

    for ip, stat in ip_stats.items():
        if ip in existing_alert_ips or ip in ("0.0.0.0", "127.0.0.1", "localhost"):
            continue

        users_list = ", ".join([f"'{u}'" for u in list(stat["users"])[:3]]) or "unknown user"
        
        # Scenario 1: Brute Force -> Success -> Privilege Escalation
        if stat["auth_fails"] >= 3 and stat["auth_success"] >= 1 and stat["priv_escalations"] >= 1:
            explanation = (
                f"CRITICAL THREAT: Multi-Stage Intrusion Chain detected from IP {ip}. "
                f"The attacker initiated {stat['auth_fails']} failed authentication attempts, "
                f"gained initial access via successful login, and immediately executed privilege escalation "
                f"to root/admin privileges targeting user account(s) {users_list}."
            )
            alert = Alert(
                title=f"Multi-Stage Account Takeover ({ip})",
                threat_type="BRUTE_FORCE_PRIV_ESCALATION",
                severity="CRITICAL",
                explanation=explanation,
                trigger_event_ids_json=json.dumps(stat["event_ids"]),
                source_ip=ip,
                target_user=list(stat["users"])[0] if stat["users"] else None,
                event_count=stat["total_count"],
                created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            )
            db.add(alert)
            new_alerts.append(alert)
            existing_alert_ips.add(ip)
            continue

        # Scenario 2: High Frequency Brute Force Attack
        if stat["auth_fails"] >= 5:
            explanation = (
                f"HIGH THREAT: High-Volume Password Brute-Force Attack detected from IP {ip}. "
                f"Recorded {stat['auth_fails']} rapid failed login attempts across accounts {users_list}. "
                f"Pattern indicates automated dictionary or credential stuffing campaign."
            )
            alert = Alert(
                title=f"Authentication Brute Force ({ip})",
                threat_type="SSH_BRUTE_FORCE",
                severity="HIGH",
                explanation=explanation,
                trigger_event_ids_json=json.dumps(stat["event_ids"]),
                source_ip=ip,
                target_user=list(stat["users"])[0] if stat["users"] else None,
                event_count=stat["auth_fails"],
                created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            )
            db.add(alert)
            new_alerts.append(alert)
            existing_alert_ips.add(ip)
            continue

        # Scenario 3: Port Scan / Network Reconnaissance
        if len(stat["distinct_ports"]) >= 4:
            explanation = (
                f"HIGH THREAT: Network Reconnaissance / Port Scan detected from IP {ip}. "
                f"The source probed {len(stat['distinct_ports'])} unique destination ports "
                f"({', '.join(str(p) for p in list(stat['distinct_ports'])[:5])}...) "
                f"within a short time frame, searching for open service vulnerabilities."
            )
            alert = Alert(
                title=f"Network Port Scan ({ip})",
                threat_type="PORT_SCAN",
                severity="HIGH",
                explanation=explanation,
                trigger_event_ids_json=json.dumps(stat["event_ids"]),
                source_ip=ip,
                target_user=None,
                event_count=stat["total_count"],
                created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            )
            db.add(alert)
            new_alerts.append(alert)
            existing_alert_ips.add(ip)
            continue

    # 3. Isolation Forest ML Anomaly Detection (Statistical Outlier Scorer)
    if len(ip_stats) >= 3:
        feature_matrix = []
        ip_keys = list(ip_stats.keys())
        for ip in ip_keys:
            s = ip_stats[ip]
            feature_matrix.append([
                s["total_count"],
                s["auth_fails"],
                s["priv_escalations"],
                len(s["distinct_ports"])
            ])

        X = np.array(feature_matrix)
        # Train Isolation Forest on normalized features
        iso = IsolationForest(contamination=0.2, random_state=42)
        preds = iso.fit_predict(X)
        scores = iso.decision_function(X)

        for idx, pred in enumerate(preds):
            ip = ip_keys[idx]
            if pred == -1 and ip not in existing_alert_ips:
                # Anomaly flagged by Isolation Forest ML model
                score_val = round(float(-scores[idx]), 3)
                s = ip_stats[ip]
                explanation = (
                    f"AI ML ANOMALY: Isolation Forest ML algorithm flagged IP {ip} as a statistical outlier "
                    f"(Anomaly Severity Score: {score_val}). Unusual burst of {s['total_count']} events "
                    f"with {s['auth_fails']} auth failures across ports {list(s['distinct_ports'])[:3]}."
                )
                alert = Alert(
                    title=f"Statistical ML Anomaly ({ip})",
                    threat_type="ISOLATION_FOREST_ANOMALY",
                    severity="HIGH",
                    explanation=explanation,
                    trigger_event_ids_json=json.dumps(s["event_ids"]),
                    source_ip=ip,
                    target_user=None,
                    event_count=s["total_count"],
                    created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                )
                db.add(alert)
                new_alerts.append(alert)
                existing_alert_ips.add(ip)

    db.commit()
    return new_alerts
