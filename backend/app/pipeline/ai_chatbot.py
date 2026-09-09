import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from ..db.models import NormalizedLog, RawLog, Alert

class AIChatbotEngine:
    """
    AI Log Intelligence & Security Assistant Engine.
    Provides natural language querying, automated incident triage, log correlation,
    and mitigation recommendations across the ULPF Asteria platform.
    Designed for 100% air-gapped, zero-dependency local operation.
    """

    IP_REGEX = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    PORT_REGEX = re.compile(r'\bport\s*[:=]?\s*(\d+)\b', re.IGNORECASE)

    EVENT_TYPE_KEYWORDS = {
        "AUTHENTICATION_FAILURE": ["failed password", "login fail", "auth fail", "bad password", "auth_failure", "brute force"],
        "AUTHENTICATION_SUCCESS": ["login success", "auth success", "session opened", "accepted password"],
        "PRIVILEGE_ESCALATION": ["privilege escalation", "sudo", "root session", "priv esc", "su root", "priv_escalation"],
        "PORT_SCAN": ["port scan", "syn scan", "reconnaissance", "scanning", "probed"],
        "UNAUTHORIZED_ACCESS": ["unauthorized", "unauthorized_access", "forbidden", "api access", "endpoint traversal"],
        "CONNECTION_BLOCKED": ["block", "blocked", "deny", "denied", "dropped", "drop"],
        "CONNECTION_ALLOWED": ["allow", "allowed", "permit", "permitted", "traffic"],
        "SYSTEM_CHATTER": ["healthcheck", "chatter", "heartbeat", "keepalive", "routine"],
        "MALFORMED_LOG": ["malformed", "corrupted", "garbage", "invalid header", "parse error"]
    }

    SEVERITY_KEYWORDS = {
        "CRITICAL": ["critical", "severe", "p0", "catastrophic"],
        "HIGH": ["high", "major", "threat", "p1"],
        "MEDIUM": ["medium", "moderate", "warning", "p2"],
        "LOW": ["low", "minor", "routine", "p3"],
        "INFO": ["info", "informational", "debug", "p4"]
    }

    @classmethod
    def get_dynamic_suggestions(cls, db: Session) -> List[str]:
        """Returns dynamic starter suggestions based on current database records."""
        suggestions = []
        alerts = db.query(Alert).all()
        if alerts:
            first_alert = alerts[0]
            if first_alert.source_ip:
                suggestions.append(f"Investigate suspicious IP {first_alert.source_ip}")
            suggestions.append("Summarize all detected security threat alerts")
        else:
            suggestions.append("Show latest security events")

        suggestions.append("What is the current pipeline deduplication rate?")
        suggestions.append("Show all failed SSH authentication attempts")
        suggestions.append("Explain any privilege escalation or root access events")
        return suggestions[:4]

    @classmethod
    def process_query(cls, db: Session, query_text: str) -> Dict[str, Any]:
        """
        Main query processing entry point.
        Extracts intent/entities, queries relevant tables, performs analysis,
        and constructs rich markdown response + interactive log traces.
        """
        raw_query = query_text.strip()
        q_lower = raw_query.lower()

        # 1. Extract Entities
        found_ips = cls.IP_REGEX.findall(raw_query)
        target_ip = found_ips[0] if found_ips else None

        # Check for port
        port_match = cls.PORT_REGEX.search(raw_query)
        target_port = int(port_match.group(1)) if port_match else None

        # Check for event type
        target_event_type = None
        for ev_type, keywords in cls.EVENT_TYPE_KEYWORDS.items():
            if any(k in q_lower for k in keywords):
                target_event_type = ev_type
                break

        # Check for severity
        target_severity = None
        for sev, keywords in cls.SEVERITY_KEYWORDS.items():
            if any(k in q_lower for k in keywords):
                target_severity = sev
                break

        # Check for specific user
        target_user = None
        user_match = re.search(r'\b(?:user|account|username)\s*[:=]?\s*([a-zA-Z0-9_\-\.]+)\b', raw_query, re.IGNORECASE)
        if user_match:
            target_user = user_match.group(1)
        elif "sysadmin" in q_lower:
            target_user = "sysadmin"
        elif "admin" in q_lower:
            target_user = "admin"
        elif "root" in q_lower and "privilege" not in q_lower:
            target_user = "root"
        elif "alice" in q_lower:
            target_user = "alice"
        elif "charlie" in q_lower:
            target_user = "charlie"

        # 2. Route to specialized handlers based on intent
        if cls._is_pipeline_metrics_query(q_lower):
            return cls._handle_pipeline_metrics(db)

        if cls._is_threat_summary_query(q_lower):
            return cls._handle_threat_summary(db, target_severity)

        if target_ip:
            return cls._handle_ip_investigation(db, target_ip, q_lower)

        if target_user:
            return cls._handle_user_investigation(db, target_user, q_lower)

        if target_event_type:
            return cls._handle_event_type_query(db, target_event_type, q_lower)

        if target_severity:
            return cls._handle_severity_query(db, target_severity, q_lower)

        # General keyword search fallback
        return cls._handle_general_search(db, raw_query)

    @classmethod
    def _is_pipeline_metrics_query(cls, q: str) -> bool:
        metric_keywords = [
            "reduction", "deduplication", "dedupe", "funnel", "throughput",
            "how many logs", "total logs", "raw received", "pipeline status",
            "compression rate", "stats", "statistics", "metrics"
        ]
        return any(k in q for k in metric_keywords)

    @classmethod
    def _is_threat_summary_query(cls, q: str) -> bool:
        threat_keywords = [
            "all threats", "all alerts", "threat summary", "security threats",
            "active incidents", "attack summary", "list alerts", "show alerts",
            "what attacks", "what threats"
        ]
        return any(k in q for k in threat_keywords)

    @classmethod
    def _handle_pipeline_metrics(cls, db: Session) -> Dict[str, Any]:
        total_raw = db.query(RawLog).count()
        total_norm = db.query(NormalizedLog).count()
        raw_logs = db.query(NormalizedLog).all()
        total_rec = sum(l.dup_count for l in raw_logs)
        dedup_count = max(0, total_rec - total_norm)
        threat_count = db.query(Alert).count()
        noise_count = db.query(NormalizedLog).filter(NormalizedLog.is_noise == True).count()
        security_count = db.query(NormalizedLog).filter(NormalizedLog.is_noise == False).count()

        red_pct = (dedup_count / total_raw * 100) if total_raw > 0 else 0.0

        response = (
            f"### 📊 Pipeline Telemetry & Reduction Intelligence\n\n"
            f"Here is the real-time operational status of the **Asteria ULPF Engine**:\n\n"
            f"| Metric Component | Value | Operational Context |\n"
            f"| :--- | :--- | :--- |\n"
            f"| **Raw Logs Ingested** | `{total_raw:,}` | Verbatim lossless capture with UUID v4 |\n"
            f"| **Canonical Stored Events** | `{total_norm:,}` | Normalized into standard schema |\n"
            f"| **Deduplicated Duplicates** | `{dedup_count:,}` | Merged via 60s sliding time window |\n"
            f"| **Log Volume Reduction** | **`{red_pct:.1f}%`** | Enterprise SIEM optimization (90%–95% benchmark) |\n"
            f"| **High-Value Security Logs** | `{security_count:,}` | Actionable telemetry for SOC triage |\n"
            f"| **Low-Value Routine Noise** | `{noise_count:,}` | Filtered system chatter & keep-alives |\n"
            f"| **Active Threat Flags** | **`{threat_count}`** | Scikit-Learn Isolation Forest & sequence rules |\n\n"
            f"💡 **Key Insight:** The 60-second sliding time-window deduplication engine has successfully compressed "
            f"`{dedup_count:,}` repetitive events into count multipliers without dropping distinct forensic data."
        )

        followups = [
            "Show all active security threat flags",
            "List high-value security events",
            "Investigate top attacker IPs"
        ]

        return {
            "response_text": response,
            "matching_logs": [],
            "related_alerts": [],
            "suggested_followups": followups
        }

    @classmethod
    def _handle_threat_summary(cls, db: Session, target_severity: Optional[str] = None) -> Dict[str, Any]:
        query = db.query(Alert)
        if target_severity:
            query = query.filter(Alert.severity == target_severity)
        alerts = query.order_by(desc(Alert.created_at)).all()

        if not alerts:
            return {
                "response_text": "🛡️ **No security threat alerts found** matching your filter. All incoming traffic is within normal baseline parameters.",
                "matching_logs": [],
                "related_alerts": [],
                "suggested_followups": ["Show all normalized logs", "What is the pipeline reduction rate?"]
            }

        response = f"### 🚨 Security Threat Intelligence Summary ({len(alerts)} Detected)\n\n"
        response += "The **AI ML Threat Engine** (Scikit-Learn Isolation Forest + Sequence Rules) detected the following incidents:\n\n"

        alerts_list = []
        for idx, a in enumerate(alerts, 1):
            sev_badge = f"🔴 **{a.severity}**" if a.severity == "CRITICAL" else f"🟠 **{a.severity}**"
            response += (
                f"#### {idx}. {a.title} ({sev_badge})\n"
                f"* **Threat Vector:** `{a.threat_type}`\n"
                f"* **Source IP:** `{a.source_ip or 'N/A'}` | **Target Account:** `{a.target_user or 'N/A'}` | **Event Volume:** `{a.event_count}`\n"
                f"* **Forensic Explanation:** {a.explanation}\n\n"
            )
            alerts_list.append({
                "id": a.id,
                "title": a.title,
                "threat_type": a.threat_type,
                "severity": a.severity,
                "source_ip": a.source_ip,
                "target_user": a.target_user,
                "explanation": a.explanation,
                "created_at": a.created_at
            })

        response += (
            f"### 🛡️ Recommended Incident Response:\n"
            f"1. **Isolate attacker IPs** at the perimeter firewall / ACL level.\n"
            f"2. **Revoke compromised sessions** and force password reset for targeted accounts (`sysadmin`, `admin`, `root`).\n"
            f"3. **Audit privileged access** on internal hosts (`nexora-app-02`, `api-gateway`).\n"
        )

        followups = [
            f"Investigate IP {alerts[0].source_ip}" if alerts[0].source_ip else "Show latest alerts",
            "Show privilege escalation events",
            "Show failed authentication logs"
        ]

        return {
            "response_text": response,
            "matching_logs": [],
            "related_alerts": alerts_list,
            "suggested_followups": followups
        }

    @classmethod
    def _handle_ip_investigation(cls, db: Session, ip: str, query_lower: str) -> Dict[str, Any]:
        logs = db.query(NormalizedLog).filter(
            or_(NormalizedLog.source_ip == ip, NormalizedLog.destination_ip == ip)
        ).order_by(NormalizedLog.timestamp.asc()).all()

        alerts = db.query(Alert).filter(Alert.source_ip == ip).all()

        if not logs:
            return {
                "response_text": f"🔍 **No log activity found** for IP address `{ip}` in the current database index.",
                "matching_logs": [],
                "related_alerts": [],
                "suggested_followups": ["Show all active threats", "List top source IPs"]
            }

        total_events = sum(l.dup_count for l in logs)
        event_types = {}
        for l in logs:
            event_types[l.event_type] = event_types.get(l.event_type, 0) + l.dup_count

        users_involved = set(l.user for l in logs if l.user)
        ports_targeted = set(l.destination_port for l in logs if l.destination_port)

        response = (
            f"### 🔍 Threat & Forensic Dossier: IP `{ip}`\n\n"
            f"**Activity Overview:**\n"
            f"* **Total Ingested Events:** `{total_events}` (across `{len(logs)}` unique canonical records)\n"
            f"* **Associated Users:** {', '.join([f'`{u}`' for u in users_involved]) or '`None`'}\n"
            f"* **Targeted Destination Ports:** {', '.join([f'`{p}`' for p in sorted(ports_targeted)]) or '`None`'}\n"
            f"* **Active Threat Alerts:** **`{len(alerts)}` alerts flagged**\n\n"
        )

        if alerts:
            response += "#### 🚨 Detected Threat Incident:\n"
            for a in alerts:
                sev_icon = "🔴" if a.severity == "CRITICAL" else "🟠"
                response += f"* {sev_icon} **{a.title}** ({a.severity}): {a.explanation}\n"
            response += "\n"

        response += "#### 📋 Event Type Breakdown:\n"
        for et, count in event_types.items():
            response += f"* `{et}`: **{count}** event(s)\n"

        response += (
            f"\n### 🛡️ Recommended Security Actions for `{ip}`:\n"
            f"1. **Firewall Block Rule:** Implement `iptables -A INPUT -s {ip} -j DROP` or add `{ip}` to Perimeter Edge WAF blocklist.\n"
            f"2. **Session Termination:** Invalidate active SSH and web session tokens originating from `{ip}`.\n"
            f"3. **Log Traceability:** Review the matching log cards below and inspect the 1:1 raw payload."
        )

        matching_logs = [cls._format_log_summary(l) for l in logs[:10]]
        alerts_list = [{"id": a.id, "title": a.title, "severity": a.severity, "explanation": a.explanation} for a in alerts]

        followups = [
            f"Show raw logs for IP {ip}",
            "Explain all critical security threats",
            "What is the current deduplication rate?"
        ]

        return {
            "response_text": response,
            "matching_logs": matching_logs,
            "related_alerts": alerts_list,
            "suggested_followups": followups
        }

    @classmethod
    def _handle_user_investigation(cls, db: Session, user: str, query_lower: str) -> Dict[str, Any]:
        logs = db.query(NormalizedLog).filter(
            NormalizedLog.user.ilike(f"%{user}%")
        ).order_by(NormalizedLog.timestamp.desc()).all()

        if not logs:
            return {
                "response_text": f"🔍 **No log records found** for user account `{user}` in the database.",
                "matching_logs": [],
                "related_alerts": [],
                "suggested_followups": ["Show all active threats", "List all users with failed logins"]
            }

        total_events = sum(l.dup_count for l in logs)
        source_ips = set(l.source_ip for l in logs if l.source_ip)
        severities = {}
        for l in logs:
            severities[l.severity] = severities.get(l.severity, 0) + l.dup_count

        response = (
            f"### 👤 User Account Activity Dossier: `{user}`\n\n"
            f"* **Total Event Volume:** `{total_events}` event(s)\n"
            f"* **Originating Source IPs:** {', '.join([f'`{ip}`' for ip in source_ips]) or '`None`'}\n"
            f"* **Severity Breakdown:** {', '.join([f'{k}: {v}' for k, v in severities.items()])}\n\n"
            f"#### 📜 Recent Normalized Events for `{user}`:\n"
        )

        for l in logs[:6]:
            response += f"* **[{l.timestamp}]** `{l.event_type}` from `{l.source_ip or 'unknown'}` — Action: `{l.action}` (Severity: `{l.severity}`)\n"

        if user.lower() in ("root", "sysadmin", "admin"):
            response += (
                f"\n⚠️ **Privileged Account Notice:** `{user}` is a high-privilege account. "
                f"Review recent `PRIVILEGE_ESCALATION` or `AUTH_FAILURE` events to ensure credential security."
            )

        matching_logs = [cls._format_log_summary(l) for l in logs[:10]]
        followups = [
            "Show privilege escalation events",
            f"Show logs from {list(source_ips)[0]}" if source_ips else "Show all threats",
            "What is the deduplication reduction rate?"
        ]

        return {
            "response_text": response,
            "matching_logs": matching_logs,
            "related_alerts": [],
            "suggested_followups": followups
        }

    @classmethod
    def _handle_event_type_query(cls, db: Session, event_type: str, query_lower: str) -> Dict[str, Any]:
        logs = db.query(NormalizedLog).filter(
            NormalizedLog.event_type == event_type
        ).order_by(NormalizedLog.timestamp.desc()).all()

        total_count = sum(l.dup_count for l in logs)
        distinct_ips = set(l.source_ip for l in logs if l.source_ip)

        response = (
            f"### 📑 Canonical Event Analysis: `{event_type}`\n\n"
            f"* **Total Occurrences:** `{total_count}` event(s) (stored as `{len(logs)}` unique canonical records)\n"
            f"* **Unique Source IPs:** {', '.join([f'`{ip}`' for ip in distinct_ips]) or '`None`'}\n\n"
            f"#### 🔎 Event Forensic Breakdown:\n"
        )

        for idx, l in enumerate(logs[:8], 1):
            response += (
                f"{idx}. **`{l.timestamp}`** | IP: `{l.source_ip or 'N/A'}` | User: `{l.user or 'N/A'}` | "
                f"Action: `{l.action}` | Duplicates: `x{l.dup_count}`\n"
            )

        if event_type == "AUTHENTICATION_FAILURE":
            response += "\n💡 **Analysis:** Multiple failed login attempts often indicate password spraying, dictionary attacks, or brute force attempts."
        elif event_type == "PRIVILEGE_ESCALATION":
            response += "\n🔴 **Critical Alert:** Privilege escalation indicates an account elevated access to root/superuser. Review immediately."
        elif event_type == "PORT_SCAN":
            response += "\n🟠 **Threat Alert:** Port scan probes indicate network reconnaissance searching for open entry points."

        matching_logs = [cls._format_log_summary(l) for l in logs[:10]]
        followups = [
            f"Investigate IP {list(distinct_ips)[0]}" if distinct_ips else "Show all threats",
            "Summarize all detected security threat alerts",
            "Show pipeline deduplication metrics"
        ]

        return {
            "response_text": response,
            "matching_logs": matching_logs,
            "related_alerts": [],
            "suggested_followups": followups
        }

    @classmethod
    def _handle_severity_query(cls, db: Session, severity: str, query_lower: str) -> Dict[str, Any]:
        logs = db.query(NormalizedLog).filter(
            NormalizedLog.severity == severity
        ).order_by(NormalizedLog.timestamp.desc()).all()

        total_count = sum(l.dup_count for l in logs)

        response = (
            f"### 🎯 Severity Tier Breakdown: `{severity}`\n\n"
            f"Found **`{total_count}` events** (in `{len(logs)}` canonical records) classified under `{severity}` severity.\n\n"
            f"| Timestamp (UTC) | Event Type | Source IP | User | Action |\n"
            f"| :--- | :--- | :--- | :--- | :--- |\n"
        )

        for l in logs[:10]:
            response += f"| `{l.timestamp}` | `{l.event_type}` | `{l.source_ip or '-'}` | `{l.user or '-'}` | `{l.action}` |\n"

        matching_logs = [cls._format_log_summary(l) for l in logs[:10]]
        followups = [
            "Show all active security threat flags",
            "What is the deduplication reduction rate?",
            "Show privilege escalation events"
        ]

        return {
            "response_text": response,
            "matching_logs": matching_logs,
            "related_alerts": [],
            "suggested_followups": followups
        }

    @classmethod
    def _handle_general_search(cls, db: Session, raw_query: str) -> Dict[str, Any]:
        tokens = [t for t in re.split(r'\s+', raw_query) if len(t) > 2 and t.lower() not in ("show", "find", "search", "what", "where", "about", "with", "from", "logs", "data")]

        if not tokens:
            tokens = [raw_query]

        search_filter = []
        for t in tokens:
            s = f"%{t}%"
            search_filter.append(
                or_(
                    NormalizedLog.source_ip.ilike(s),
                    NormalizedLog.user.ilike(s),
                    NormalizedLog.event_type.ilike(s),
                    NormalizedLog.service.ilike(s),
                    NormalizedLog.action.ilike(s),
                    NormalizedLog.hostname.ilike(s),
                    NormalizedLog.format_detected.ilike(s)
                )
            )

        query = db.query(NormalizedLog)
        if search_filter:
            query = query.filter(or_(*search_filter))

        logs = query.order_by(NormalizedLog.timestamp.desc()).limit(15).all()

        if not logs:
            return {
                "response_text": (
                    f"🤖 I couldn't find exact matches for **\"{raw_query}\"** in the indexed database.\n\n"
                    f"**Suggested Queries you can ask me:**\n"
                    f"* 🔍 *\"Investigate IP 192.168.1.105\"* or *\"Investigate IP 10.0.4.22\"*\n"
                    f"* 🚨 *\"Summarize all security threats\"* or *\"Explain root privilege escalation\"*\n"
                    f"* 📊 *\"What is the deduplication reduction percentage?\"*\n"
                    f"* 🔑 *\"Show all failed SSH authentications\"*\n"
                    f"* 👤 *\"Show activity for user sysadmin\"*"
                ),
                "matching_logs": [],
                "related_alerts": [],
                "suggested_followups": [
                    "Summarize all detected security threat alerts",
                    "What is the current deduplication rate?",
                    "Show all failed SSH authentication attempts"
                ]
            }

        response = (
            f"### 🔎 Search Results for: *\"{raw_query}\"*\n\n"
            f"Found `{len(logs)}` matching canonical record(s) in the database:\n\n"
            f"| Timestamp | Event Type | Source IP | User | Severity | Action |\n"
            f"| :--- | :--- | :--- | :--- | :--- | :--- |\n"
        )

        for l in logs[:10]:
            response += f"| `{l.timestamp}` | `{l.event_type}` | `{l.source_ip or '-'}` | `{l.user or '-'}` | `{l.severity}` | `{l.action}` |\n"

        response += "\n💡 Click **\"Inspect Trace\"** on any card below to view the verbatim raw source log line."

        matching_logs = [cls._format_log_summary(l) for l in logs[:10]]
        followups = [
            "Summarize all detected security threat alerts",
            "Show pipeline deduplication metrics",
            "Show critical security events"
        ]

        return {
            "response_text": response,
            "matching_logs": matching_logs,
            "related_alerts": [],
            "suggested_followups": followups
        }

    @classmethod
    def _format_log_summary(cls, log: NormalizedLog) -> Dict[str, Any]:
        return {
            "id": log.id,
            "raw_event_id": log.raw_event_id,
            "timestamp": log.timestamp,
            "event_type": log.event_type,
            "category": log.category,
            "severity": log.severity,
            "source_ip": log.source_ip,
            "destination_ip": log.destination_ip,
            "user": log.user,
            "action": log.action,
            "service": log.service,
            "format_detected": log.format_detected,
            "dup_count": log.dup_count,
            "is_noise": log.is_noise
        }
