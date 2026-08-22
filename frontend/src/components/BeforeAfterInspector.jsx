import React, { useState } from 'react';
import { 
  Search, 
  GitCompare, 
  Terminal, 
  CheckCircle2, 
  Code, 
  VolumeX, 
  Volume2, 
  ArrowRight,
  ShieldAlert,
  Layers
} from 'lucide-react';

export default function BeforeAfterInspector({ logs, onTraceLog, selectedTrace }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [hideNoise, setHideNoise] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'json'

  const filteredLogs = logs.filter(log => {
    if (hideNoise && log.is_noise) return false;
    if (eventTypeFilter && log.event_type !== eventTypeFilter) return false;
    if (severityFilter && log.severity !== severityFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchIp = log.source_ip?.toLowerCase().includes(term);
      const matchUser = log.user?.toLowerCase().includes(term);
      const matchType = log.event_type?.toLowerCase().includes(term);
      const matchFormat = log.format_detected?.toLowerCase().includes(term);
      if (!matchIp && !matchUser && !matchType && !matchFormat) return false;
    }
    return true;
  });

  const handleRowClick = (log) => {
    setSelectedLogId(log.id);
    onTraceLog(log.id);
  };

  const currentLog = logs.find(l => l.id === selectedLogId) || (filteredLogs.length > 0 ? filteredLogs[0] : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner explaining PS Traceability */}
      <div className="cyber-card-glow" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitCompare size={20} /> Before / After Lossless Raw Traceability Console
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Demonstrates 1:1 foreign-key link (<code style={{ color: '#00f0ff' }}>raw_event_id</code>) connecting every structured canonical event back to its exact verbatim raw log string.
          </p>
        </div>
        <span className="badge-fmt badge-json" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
          Lossless 1:1 Traceability
        </span>
      </div>

      {/* Filter Control Bar */}
      <div className="cyber-card" style={{ padding: '0.85rem 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="cyber-input"
              placeholder="Search by IP, User, Event Type, Format..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Event Type Filter */}
          <select 
            className="cyber-input" 
            value={eventTypeFilter} 
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Event Types</option>
            <option value="AUTHENTICATION_FAILURE">AUTHENTICATION_FAILURE</option>
            <option value="AUTHENTICATION_SUCCESS">AUTHENTICATION_SUCCESS</option>
            <option value="PRIVILEGE_ESCALATION">PRIVILEGE_ESCALATION</option>
            <option value="PORT_SCAN">PORT_SCAN</option>
            <option value="CONNECTION_BLOCKED">CONNECTION_BLOCKED</option>
            <option value="SYSTEM_CHATTER">SYSTEM_CHATTER</option>
            <option value="MALFORMED_LOG">MALFORMED_LOG</option>
          </select>

          {/* Severity Filter */}
          <select 
            className="cyber-input" 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>

          {/* Hide Noise Toggle */}
          <button 
            onClick={() => setHideNoise(!hideNoise)}
            className="btn-cyber-secondary"
            style={{ 
              padding: '0.45rem 0.75rem', 
              fontSize: '0.78rem',
              borderColor: hideNoise ? '#00f0ff' : '#1e293b',
              color: hideNoise ? '#00f0ff' : '#94a3b8',
              background: hideNoise ? 'rgba(0, 240, 255, 0.1)' : '#0f172a'
            }}
          >
            {hideNoise ? <VolumeX size={14} color="#00f0ff" /> : <Volume2 size={14} />}
            {hideNoise ? "Noise Hidden" : "Show All"}
          </button>
        </div>
      </div>

      {/* Split-Screen Inspector View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', minHeight: '520px' }}>
        {/* Left Column: Normalized Logs Selection Table */}
        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1b263b' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#34d399" /> Structured Events ({filteredLogs.length})
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click row to trace raw log line</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1b263b', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Time</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Event Type</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Format</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Source IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No normalized logs match filter criteria.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((l) => {
                  const isSelected = selectedLogId === l.id || currentLog?.id === l.id;
                  const sevClass = 
                    l.severity === 'CRITICAL' ? 'badge-sev-critical' :
                    l.severity === 'HIGH' ? 'badge-sev-high' :
                    l.severity === 'MEDIUM' ? 'badge-sev-medium' : 'badge-sev-low';

                  const fmtClass = 
                    l.format_detected === 'SYSLOG' ? 'badge-syslog' :
                    l.format_detected === 'KV_PIPE' ? 'badge-kv' :
                    l.format_detected === 'BRACKETED' ? 'badge-bracketed' :
                    l.format_detected === 'JSON_LINES' ? 'badge-json' :
                    l.format_detected === 'PALO_ALTO_CSV' ? 'badge-custom' : 'badge-malformed';

                  return (
                    <tr
                      key={l.id}
                      onClick={() => handleRowClick(l)}
                      style={{
                        borderBottom: '1px solid #131b2e',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.45rem 0.5rem', color: '#94a3b8' }} className="mono">
                        {l.timestamp ? l.timestamp.split('T')[1]?.replace('Z', '') : '--:--:--'}
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem' }}>
                        <span className={`badge-sev ${sevClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                          {l.event_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem' }}>
                        <span className={`badge-fmt ${fmtClass}`}>{l.format_detected}</span>
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#00f0ff' }} className="mono">
                        {l.source_ip || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: 1:1 Raw Log vs Canonical Event Split Inspector */}
        <div className="cyber-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1b263b' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Terminal size={16} /> 1:1 Verbatim Raw Log & Schema Link
            </h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={() => setViewMode('grid')} 
                style={{ background: viewMode === 'grid' ? '#00f0ff' : '#1e293b', color: viewMode === 'grid' ? '#040914' : '#f8fafc', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Schema Grid
              </button>
              <button 
                onClick={() => setViewMode('json')} 
                style={{ background: viewMode === 'json' ? '#00f0ff' : '#1e293b', color: viewMode === 'json' ? '#040914' : '#f8fafc', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                JSON Schema
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {/* Box 1: BEFORE — Lossless Verbatim Raw Log */}
            <div style={{ background: '#050811', border: '1px dashed #00f0ff', borderRadius: '0.375rem', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  BEFORE: Lossless Raw Log (Stored Verbatim)
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }} className="mono">
                  RAW ID: {selectedTrace?.raw_event?.id || currentLog?.raw_event_id || 'N/A'}
                </span>
              </div>
              <pre style={{ 
                color: '#34d399', 
                fontSize: '0.8rem', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all', 
                background: '#02050b', 
                padding: '0.65rem', 
                borderRadius: '0.25rem',
                border: '1px solid #1b263b'
              }} className="mono">
                {selectedTrace?.raw_event?.raw_text || "Click row to load exact verbatim raw log line..."}
              </pre>
            </div>

            {/* Glowing Connection Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#00f0ff', fontSize: '0.75rem', fontWeight: 700 }}>
              <span>PARSED & NORMALIZED TO CANONICAL SCHEMA</span>
              <ArrowRight size={16} />
            </div>

            {/* Box 2: AFTER — Structured Normalized Event */}
            <div style={{ background: '#090e1a', border: '1px solid #1b263b', borderRadius: '0.375rem', padding: '0.85rem', flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                AFTER: Canonical Event Taxonomy Record
              </div>

              {viewMode === 'json' ? (
                <pre style={{ color: '#60a5fa', fontSize: '0.75rem', background: '#050811', padding: '0.65rem', borderRadius: '0.25rem', overflowX: 'auto' }} className="mono">
                  {JSON.stringify(currentLog, null, 2)}
                </pre>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.78rem' }}>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Event Type: </span>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{currentLog?.event_type || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Detected Format: </span>
                    <span style={{ fontWeight: 700, color: '#00f0ff' }} className="mono">{currentLog?.format_detected || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Category: </span>
                    <span style={{ fontWeight: 700, color: '#60a5fa' }}>{currentLog?.category || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Severity: </span>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{currentLog?.severity || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Source IP: </span>
                    <span style={{ fontWeight: 700, color: '#00f0ff' }} className="mono">{currentLog?.source_ip || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Target User: </span>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{currentLog?.user || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Action Taken: </span>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>{currentLog?.action || 'N/A'}</span>
                  </div>
                  <div style={{ background: '#050811', border: '1px solid #1b263b', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b' }}>Deduplicated: </span>
                    <span style={{ fontWeight: 700, color: '#c084fc' }}>x{currentLog?.dup_count || 1}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
