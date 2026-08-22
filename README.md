# Universal Log Pre-processing Framework (ULPF)

> **Smart India Hackathon Prototype**  
> **Problem Statement ID:** 26156  
> **Organization:** National Technical Research Organisation (NTRO)

ULPF is an enterprise-grade log ingestion and pre-processing engine designed for heterogeneous perimeter security devices (firewalls, VPN gateways, SSH daemons, IDS/IPS, routers). It ingests logs from any format, preserves raw events losslessly, extracts source-specific fields, normalizes data into a unified canonical schema, deduplicates chatter, and feeds a lightweight AI threat detector with plain-language explanations.

---

## Key Features

1. **Lossless Raw Capture**: Stores raw log text verbatim in SQLite database with a permanent UUID v4 `raw_event_id`.
2. **Multi-Format Auto-Detection**: Accepts Syslog (RFC 3164/5424), Key-Value Pipe (`|`), Bracketed Shorthand (`[...]`), JSON Lines, and Custom Config Plugins out-of-the-box.
3. **Canonical Event Taxonomy**: Maps variant phrases (`Failed password`, `LOGIN_FAIL`, `AUTH_FAILURE`) to canonical `event_type` enums and converts timestamps to standard ISO-8601 UTC.
4. **1:1 Traceability**: Click any processed event in the UI inspector to see the exact raw line that produced it.
5. **Sliding Window Deduplication**: Collapses repeated identical logs within a 60-second window into a single record with incremented `dup_count` and `last_seen` timestamp.
6. **Zero Data Loss Noise Filtering**: Separates high-value security events from low-value chatter without deleting low-value records.
7. **Plug-and-Play Parser Studio**: Onboard new log formats live via Regex + Field Mapping JSON via API/UI without restarting backend code.
8. **AI/ML Anomaly Detector & Explainer**: Uses scikit-learn `IsolationForest` and sequence attack rules to detect multi-stage intrusions (Brute Force → Auth Success → Privilege Escalation) and generates plain-language threat explanations.
9. **Interactive Dashboard**: Modern glassmorphic React UI featuring Pipeline Funnel Metrics, Before/After Inspector, Threat Alerts, and Ingest Studio.

---

## Quick Start & Setup

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 1. Run Backend Server (FastAPI)

```bash
# Navigate to workspace root
cd /path/to/ai-log-intelligence

# Set up virtual environment and install dependencies
python3 -m venv backend/venv
./backend/venv/bin/pip install -r backend/requirements.txt

# Launch FastAPI backend server (Port 8000)
PYTHONPATH=backend ./backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 2. Run Frontend Dashboard (React + Vite)

```bash
# In a second terminal
cd /path/to/ai-log-intelligence/frontend

# Install dependencies and start Vite dev server
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Dashboard UI will be live at `http://localhost:5173`.

---

## Running Automated Unit Tests

```bash
PYTHONPATH=backend ./backend/venv/bin/pytest backend/tests/test_pipeline.py
```

---

## Demo Dataset: Nexora Technologies

ULPF includes a synthetic enterprise dataset representing **Nexora Technologies**:
- **75% Normal Traffic**: Connection allows, health checks, regular logins across 4 raw log formats.
- **4 Attack Scenarios**:
  1. SSH Password Brute Force (`192.168.1.105`)
  2. Brute Force → Auth Success → Root Privilege Escalation (`10.0.4.22`)
  3. Network Port Scan / Reconnaissance (`172.16.0.88`)
  4. Unauthorized API Endpoint Access (`198.51.100.4`)
- **Corrupted / Malformed Lines**: Tested against fallback safe parsing (never crashes!).

Click **"Stream Nexora Dataset"** in the UI Ingest Studio tab to demonstrate the full pipeline live.

---

## Air-Gapped Readiness

All backend models, parsers, database engines, and UI libraries run 100% locally with zero external network or cloud service dependencies.
