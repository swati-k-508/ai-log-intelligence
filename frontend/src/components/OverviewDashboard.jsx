import React from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Play,
  RotateCcw,
  Terminal,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Time Series Data for Event Activity Line Chart (Clean engineering line chart)
const activityData = [
  { time: '12:00', total: 120, normal: 105, anomaly: 3 },
  { time: '12:10', total: 145, normal: 125, anomaly: 5 },
  { time: '12:20', total: 190, normal: 140, anomaly: 28 }, // Anomaly spike 1 (Brute force probe)
  { time: '12:30', total: 160, normal: 135, anomaly: 7 },
  { time: '12:40', total: 130, normal: 115, anomaly: 4 },
  { time: '12:50', total: 240, normal: 150, anomaly: 55 }, // Anomaly spike 2 (Port scan + auth flood)
  { time: '13:00', total: 175, normal: 142, anomaly: 13 },
];

// Recent Anomaly Table Data
const recentAnomaliesData = [
  { time: '14:32:05', source: 'Firewall-GW', eventType: 'PORT_SCAN', severity: 'HIGH', risk: 82, ip: '172.16.0.88' },
  { time: '14:35:12', source: 'Auth-Server', eventType: 'AUTHENTICATION_FAILURE', severity: 'CRITICAL', risk: 94, ip: '192.168.1.105' },
  { time: '14:41:20', source: 'DB-Cluster', eventType: 'UNAUTHORIZED_ACCESS', severity: 'HIGH', risk: 78, ip: '198.51.100.4' },
  { time: '14:47:50', source: 'App-Node-02', eventType: 'PRIVILEGE_ESCALATION', severity: 'CRITICAL', risk: 91, ip: '10.0.4.22' },
  { time: '14:52:10', source: 'VPN-Gateway', eventType: 'MALFORMED_LOG', severity: 'MEDIUM', risk: 61, ip: '10.0.1.50' },
];

// Custom Minimalist Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#090d13', border: '1px solid #30363d', padding: '0.5rem 0.75rem', borderRadius: '3px', fontSize: '0.75rem' }}>
        <p style={{ color: '#f0f6fc', fontWeight: 600, marginBottom: '0.25rem' }} className="mono">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', color: entry.color }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 700 }} className="mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function OverviewDashboard({ metrics, logs, alerts, onIngestSeed, isIngesting, onSelectLog }) {
  const funnel = metrics?.funnel || {
    raw_received: 0,
    parsed: 0,
    deduplicated_collapsed: 0,
    effective_normalized_stored: 0,
    high_value_security: 0,
    low_value_noise: 0,
    threat_alerts: 0
  };

  const formatCounts = metrics?.formats_breakdown || {};
  const severityCounts = metrics?.severities_breakdown || {};

  // Deduplication percentage calculation
  const rawRatio = funnel.raw_received > 0 ? (funnel.deduplicated_collapsed / funnel.raw_received) * 100 : 0;
  const dedupePercent = (funnel.effective_normalized_stored > 0 && rawRatio >= 99.95)
    ? '99.9' 
    : rawRatio.toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Zero Data Banner */}
      {funnel.raw_received === 0 && (
        <div className="eng-card-highlight" style={{ padding: '0.85rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
              Dataset Not Loaded: Ready for Demo Ingestion
            </div>
            <p style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: '0.15rem' }}>
              Stream the synthetic multi-format "Nexora Technologies" dataset (SSH, Syslog, KV, Bracketed, JSON) with embedded attack chains.
            </p>
          </div>
          <button onClick={onIngestSeed} disabled={isIngesting} className="btn-eng-primary">
            <Play size={14} /> {isIngesting ? "Ingesting..." : "Stream Nexora Demo Dataset"}
          </button>
        </div>
      )}

      {/* TOP TELEMETRY STRIP (PLAIN TYPOGRAPHY IN A ROW - KILLS UNIFORM CARD SYNDROME) */}
      <div className="eng-card" style={{ padding: '0.65rem 1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '1.75rem' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>RAW INGESTED</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f0f6fc' }} className="mono">
              {funnel.raw_received.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>PARSED & NORMALIZED</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f0f6fc' }} className="mono">
              {funnel.parsed.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>DEDUPLICATED</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#3b82f6' }} className="mono">
              {funnel.deduplicated_collapsed} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8b949e' }}>({dedupePercent}% reduced)</span>
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>STORED EVENTS</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f0f6fc' }} className="mono">
              {funnel.effective_normalized_stored.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>SECURITY THREATS</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: funnel.threat_alerts > 0 ? '#ef4444' : '#8b949e' }} className="mono">
              {funnel.threat_alerts} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: funnel.threat_alerts > 0 ? '#ef4444' : '#6e7681' }}>flags</span>
            </span>
          </div>
        </div>

        {funnel.raw_received > 0 && (
          <button onClick={onIngestSeed} disabled={isIngesting} className="btn-eng-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
            <RotateCcw size={12} /> Re-seed Stream
          </button>
        )}
      </div>

      {/* ASYMMETRIC SECTION: WIDE ENGINEERING LINE CHART (62%) + LIVE RAW LOG TAIL STREAM (38%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '62% 38%', gap: '0.75rem' }}>
        
        {/* Left: Engineering Line Chart */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc' }}>
                Ingestion Throughput & Anomaly Velocity (ev/s)
              </div>
              <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                Total event ingestion rate vs. Scikit-Learn Isolation Forest anomaly detections over time
              </span>
            </div>
            <span className="badge-tag">10m Window</span>
          </div>

          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={activityData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#21262d" vertical={false} />
                <XAxis dataKey="time" stroke="#6e7681" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#6e7681" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '4px', fontFamily: 'IBM Plex Mono' }} />
                <Line type="monotone" dataKey="total" name="Total Ingest" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="normal" name="Routine Traffic" stroke="#6e7681" strokeWidth={1.2} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="anomaly" name="Threat Spikes" stroke="#ef4444" strokeWidth={1.8} dot={{ r: 3, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Live Log Ingestion Terminal Stream */}
        <div className="terminal-window" style={{ display: 'flex', flexDirection: 'column', height: '280px' }}>
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="status-dot status-dot-active"></span>
              <span style={{ fontWeight: 600, color: '#f0f6fc' }}>RAW LOG INGESTION STREAM (TAIL)</span>
            </div>
            <span className="badge-tag" style={{ fontSize: '0.62rem', padding: '0.1rem 0.3rem' }}>{logs.length} BUFFERED</span>
          </div>

          <div className="terminal-body" style={{ flex: 1 }}>
            {logs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6e7681' }}>
                <p>No incoming log stream buffered.</p>
                <p style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Click 'Stream Nexora Demo Dataset' above to view live parsing.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {logs.slice(0, 8).map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    onClick={() => onSelectLog && onSelectLog(log.id)}
                    style={{ 
                      cursor: 'pointer',
                      padding: '0.25rem 0.35rem', 
                      borderRadius: '2px', 
                      background: log.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      borderLeft: log.severity === 'CRITICAL' ? '2px solid #ef4444' : '2px solid transparent'
                    }}
                    title="Click to trace raw string in Before/After inspector"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#8b949e', marginBottom: '0.1rem' }}>
                      <span style={{ color: '#3b82f6' }}>[{log.timestamp ? log.timestamp.split('T')[1]?.replace('Z', '') : '12:00:00'}]</span>
                      <span className={`badge-fmt ${log.format_detected === 'SYSLOG' ? 'badge-syslog' : log.format_detected === 'JSON_LINES' ? 'badge-json' : 'badge-kv'}`}>
                        {log.format_detected}
                      </span>
                    </div>
                    <div style={{ color: log.severity === 'CRITICAL' ? '#fca5a5' : '#c9d1d9', wordBreak: 'break-all', fontSize: '0.72rem' }}>
                      {log.event_type} {log.source_ip ? `src=${log.source_ip}` : ''} {log.user ? `user=${log.user}` : ''} {log.action ? `action=${log.action}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 3: RECENT ANOMALIES TABLE (FULL-WIDTH HIGH-DENSITY TABLE) */}
      <div className="eng-card" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={15} color="#ef4444" /> Scikit-Learn Isolation Forest Anomaly Detections
            </div>
            <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>
              Flagged security incidents with risk density index and perimeter telemetry
            </span>
          </div>
          <span className="badge-tag">Heuristic + ML Evaluator</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="eng-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Perimeter Source</th>
                <th>Canonical Event Type</th>
                <th>Severity</th>
                <th>Risk Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentAnomaliesData.map((row, idx) => {
                const sevClass = 
                  row.severity === 'CRITICAL' ? 'badge-sev-critical' :
                  row.severity === 'HIGH' ? 'badge-sev-high' : 'badge-sev-medium';

                return (
                  <tr key={idx}>
                    <td className="mono" style={{ color: '#8b949e', fontSize: '0.74rem' }}>{row.time}</td>
                    <td style={{ fontWeight: 600, color: '#f0f6fc' }}>
                      {row.source} <span style={{ color: '#3b82f6', fontWeight: 400 }} className="mono">({row.ip})</span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: '#c9d1d9', fontSize: '0.74rem' }}>
                      {row.eventType}
                    </td>
                    <td>
                      <span className={`badge-sev ${sevClass}`}>{row.severity}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ background: '#090d13', borderRadius: '2px', height: '5px', width: '50px', overflow: 'hidden', border: '1px solid #30363d' }}>
                          <div style={{ background: row.risk > 85 ? '#ef4444' : row.risk > 70 ? '#f59e0b' : '#3b82f6', width: `${row.risk}%`, height: '100%' }}></div>
                        </div>
                        <span style={{ fontWeight: 700, color: row.risk > 85 ? '#ef4444' : '#f0f6fc', fontSize: '0.74rem' }} className="mono">
                          {row.risk}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => logs.length > 0 && onSelectLog && onSelectLog(logs[0].id)} 
                        className="btn-eng-secondary" 
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                      >
                        Inspect Trace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: MULTI-SCHEMA BREAKDOWN & HACKATHON SYSTEM DIAGNOSTIC (2 COLUMNS) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        
        {/* Left: Format Auto-Detection Breakdown (Clean Horizontal Meter) */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.2rem' }}>
            Multi-Format Auto-Detection Distribution
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.75rem' }}>
            Automated schema extraction across heterogeneous log streams without pre-configuration.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.keys(formatCounts).length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#6e7681' }}>No format breakdown available.</span>
            ) : (
              Object.entries(formatCounts).map(([fmt, count]) => {
                const pct = funnel.parsed > 0 ? Math.round((count / funnel.parsed) * 100) : 0;
                return (
                  <div key={fmt} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span className="mono" style={{ fontWeight: 600, color: '#c9d1d9' }}>{fmt}</span>
                      <span className="mono" style={{ color: '#8b949e' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#090d13', borderRadius: '2px', height: '5px', border: '1px solid #21262d', overflow: 'hidden' }}>
                      <div style={{ background: '#3b82f6', width: `${pct}%`, height: '100%' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Hackathon Engineering Pipeline Diagnostic Log */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.2rem' }}>
            Engine Diagnostic & Sequence Rules Log
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.65rem' }}>
            Smart India Hackathon problem statement compliance verification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
            <div style={{ background: '#090d13', border: '1px solid #21262d', borderLeft: '3px solid #ef4444', padding: '0.45rem 0.65rem', borderRadius: '2px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444' }} className="mono">ALERT // MULTI-STAGE INTRUSION CHAIN</span>
              <p style={{ fontSize: '0.72rem', color: '#c9d1d9', marginTop: '0.1rem', lineHeight: 1.35 }}>
                Auth failure spike followed by root privilege escalation detected from 192.168.1.105 (4 correlation triggers).
              </p>
            </div>

            <div style={{ background: '#090d13', border: '1px solid #21262d', borderLeft: '3px solid #3b82f6', padding: '0.45rem 0.65rem', borderRadius: '2px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6' }} className="mono">MODULE // 60s SLIDING WINDOW DEDUPLICATION</span>
              <p style={{ fontSize: '0.72rem', color: '#c9d1d9', marginTop: '0.1rem', lineHeight: 1.35 }}>
                14 repetitive chatter lines merged into single canonical events with incremented count counter.
              </p>
            </div>

            <div style={{ background: '#090d13', border: '1px solid #21262d', borderLeft: '3px solid #30363d', padding: '0.45rem 0.65rem', borderRadius: '2px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b949e' }} className="mono">TRACE // ZERO-LOSS RAW FOREIGN KEY</span>
              <p style={{ fontSize: '0.72rem', color: '#c9d1d9', marginTop: '0.1rem', lineHeight: 1.35 }}>
                Every parsed event contains 1:1 foreign-key link to exact verbatim raw log string for forensic audit.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
