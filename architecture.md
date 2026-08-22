# Universal Log Pre-processing Framework (ULPF) — Architecture Document

**PS ID:** 26156 | **Organization:** National Technical Research Organisation (NTRO)  
**System Name:** Universal Log Pre-processing Framework (ULPF)  
**Deployment Target:** Air-Gapped Enterprise Perimeter Security Network

---

## 1. System Overview & Problem Alignment

Modern enterprise networks generate high volumes of logs from heterogeneous perimeter security devices (firewalls, VPN gateways, SSH daemons, IDS/IPS, and routers) formatted in Syslog (RFC 3164/5424), Key-Value Pipe, Bracketed Shorthand, JSON Lines, and proprietary vendor formats (Palo Alto CSV, CEF). 

ULPF solves the central SIEM ingestion challenge by providing a **lossless, modular pre-processing pipeline** that standardizes arbitrary logs into a single **Canonical Event Taxonomy Schema**, deduplicates repetitive chatter within sliding time windows, separates high-value security events from noise without data loss, and feeds a lightweight AI/ML anomaly detection engine with plain-language threat explanations.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ULPF PIPELINE ARCHITECTURE                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ Raw Perimeter Logs ] ──► (Syslog, KV Pipe, Bracketed, JSON Lines, Proprietary CSV)
          │
          ▼
┌───────────────────┐     ┌──────────────────────────────────────────────────────────────┐
│ 1. LOSSLESS       │ ──► │ RAW LOG STORE (SQLite / Postgres)                            │
│    RAW CAPTURE    │     │ Permanent UUID v4, verbatim text, received timestamp          │
└───────────────────┘     └──────────────────────────────────────────────────────────────┘
          │                                      ▲
          ▼                                      │ (1:1 Traceability FK: raw_event_id)
┌───────────────────┐                            │
│ 2. MULTI-FORMAT   │ ──► Auto-detects schema format (Fallback error handling - never crashes)
│    PARSER ENGINE  │     Plug-and-Play Regex Config Plugins loaded dynamically
└───────────────────┘
          │
          ▼
┌───────────────────┐
│ 3. TAXONOMY       │ ──► Maps variant terms (Failed password, LOGIN_FAIL) -> AUTHENTICATION_FAILURE
│    NORMALIZATION  │     Standardizes timestamps to ISO-8601 UTC (YYYY-MM-DDTHH:MM:SSZ)
└───────────────────┘
          │
          ▼
┌───────────────────┐
│ 4. CLEAN & DEDUPE │ ──► Collapses duplicate logs within 60s sliding window (count + time_window)
└───────────────────┘
          │
          ▼
┌───────────────────┐
│ 5. NOISE FILTER   │ ──► Flags LOW_VALUE_CHATTER vs HIGH_VALUE_SECURITY (Zero data loss)
└───────────────────┘
          │
          ▼
┌───────────────────┐
│ 6. AI/ML ANOMALY  │ ──► Scikit-Learn Isolation Forest + Attack Sequence Rule Engine
│    & EXPLAINER    │     Outputs Plain-Language Threat Explanations for security analysts
└───────────────────┘
          │
          ▼
┌───────────────────┐
│ 7. EXECUTIVE &    │ ──► Before/After Inspector (1:1 Raw Traceability), Pipeline Funnel Metrics,
│    TECH DASHBOARD │     AI Threat Alerts, Plug-and-Play Parser Studio
└───────────────────┘
```

---

## 2. Core Functional Requirements Verification Matrix

| PS ID Requirement | Implementation Mechanism | System Guarantee |
| :--- | :--- | :--- |
| **1. Lossless Raw Capture** | `app/pipeline/ingest.py` | Every raw line is written verbatim to `raw_logs` DB table with a unique UUID v4 before parsing. |
| **2. Multi-Format Parsing** | `app/pipeline/parse.py` | Auto-detects 4 core formats (Syslog, KV-Pipe, Bracketed, JSON Lines) + dynamic plugin regex configs. |
| **3. Field Extraction** | `app/pipeline/parse.py` | Extracts timestamp, `source_ip`, `destination_ip`, `destination_port`, `user`, `hostname`, `service`, `action`, `protocol`, `bytes`. |
| **4. Taxonomy Normalization** | `app/pipeline/normalize.py` | Maps 15+ variant event phrases to 6 canonical `event_type` enums. Standardizes timestamps to ISO-8601 UTC. |
| **5. 1:1 Traceability** | `NormalizedLog.raw_event_id` | Foreign key link enables clicking any processed event in UI to highlight exact verbatim raw line. |
| **6. Cleaning & Deduplication** | `app/pipeline/clean_dedupe.py` | Malformed entries recover safely. Consecutive duplicate logs within 60s window merge into count + window. |
| **7. Zero-Loss Noise Filtering** | `app/pipeline/filter.py` | Tags `is_noise=True` vs `False`. Low-value chatter stays queryable in DB while filtering analyst view. |
| **8. Plug-and-Play Onboarding** | `ParserPluginConfig` & API | Register new log formats via regex/mapping JSON live via API/UI without restarting backend code. |
| **9. AI/ML Threat Explanations** | `app/pipeline/ml_detector.py` | Scikit-learn Isolation Forest + sequence detection. Plain-language explanations ("Brute Force -> Success -> Root Escalation"). |
| **10. Interactive Dashboard** | React 18 + Glassmorphism UI | Before/After Inspector, Visual Pipeline Funnel, AI Threat Alerts, Plug-and-Play Studio. |

---

## 3. Technology Stack & Air-Gapped Deployment

- **Backend Framework:** Python 3.13, FastAPI, Uvicorn
- **Database Layer:** SQLAlchemy ORM, SQLite (`ulpf.db` - easily swappable to PostgreSQL)
- **Machine Learning:** Scikit-Learn (`IsolationForest`), NumPy
- **Frontend Framework:** React 18, Vite, Vanilla Glassmorphism CSS, Lucide React Icons
- **Air-Gapped Compliance:** Zero external cloud API calls or internet dependencies required at runtime.
