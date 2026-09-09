import React, { useState } from 'react';
import { 
  Search, 
  GitCompare, 
  Terminal, 
  CheckCircle2, 
  VolumeX, 
  Volume2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function BeforeAfterInspector({ logs, onTraceLog, selectedTrace }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [hideNoise, setHideNoise] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card-highlight" style={{ padding: '0.85rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
            Lossless Raw Traceability Console
          </div>
          <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
            Demonstrates 1:1 foreign-key link (<span className="mono" style={{ color: '#3b82f6' }}>raw_event_id</span>) connecting structured canonical event records back to the verbatim raw log line.
          </p>
        </div>
        <span className="badge-tag" style={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
          Foreign Key Verified
        </span>
      </div>

      {/* Filter Control Bar */}
      <div className="eng-card" style={{ padding: '0.6rem 0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} color="#6e7681" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="eng-input"
            placeholder="Search by IP, user, format..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2rem', fontSize: '0.78rem' }}
          />
        </div>

        <select 
          className="eng-input" 
          value={eventTypeFilter} 
          onChange={(e) => setEventTypeFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '0.78rem' }}
        >
          <option value="">All Event Types</option>
          <option value="AUTHENTICATION_FAILURE">AUTHENTICATION_FAILURE</option>
          <option value="AUTHENTICATION_SUCCESS">AUTHENTICATION_SUCCESS</option>
          <option value="PRIVILEGE_ESCALATION">PRIVILEGE_ESCALATION</option>
          <option value="PORT_SCAN">PORT_SCAN</option>
          <option value="CONNECTION_BLOCKED">CONNECTION_BLOCKED</option>
          <option value="SYSTEM_CHATTER">SYSTEM_CHATTER</option>
        </select>

        <select 
          className="eng-input" 
          value={severityFilter} 
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '0.78rem' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <button 
          onClick={() => setHideNoise(!hideNoise)}
          className="btn-eng-secondary"
          style={{ 
            padding: '0.35rem 0.65rem', 
            fontSize: '0.74rem',
            borderColor: hideNoise ? '#3b82f6' : '#30363d',
            color: hideNoise ? '#3b82f6' : '#8b949e',
            background: hideNoise ? '#162032' : '#21262d'
          }}
        >
          {hideNoise ? <VolumeX size={13} color="#3b82f6" /> : <Volume2 size={13} />}
          {hideNoise ? "Noise Masked" : "Show All"}
        </button>
      </div>

      {/* Split-Screen Inspector View */}
      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '0.75rem', minHeight: '500px' }}>
        
        {/* Left Column: Normalized Logs Selection Table */}
        <div className="eng-card" style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid #30363d' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f6fc' }}>
              Normalized Events ({filteredLogs.length})
            </span>
            <span style={{ fontSize: '0.68rem', color: '#6e7681' }}>Click row to trace</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event Type</th>
                  <th>Format</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isSelected = (selectedLogId === log.id) || (!selectedLogId && currentLog?.id === log.id);
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => handleRowClick(log)}
                      style={{ 
                        cursor: 'pointer',
                        background: isSelected ? '#21262d' : 'transparent',
                        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent'
                      }}
                    >
                      <td className="mono" style={{ color: '#8b949e', fontSize: '0.72rem' }}>
                        {log.timestamp ? log.timestamp.split('T')[1]?.replace('Z', '') : '--:--:--'}
                      </td>
                      <td className="mono" style={{ fontWeight: 600, color: isSelected ? '#ffffff' : '#f0f6fc', fontSize: '0.72rem' }}>
                        {log.event_type}
                      </td>
                      <td>
                        <span className="badge-fmt" style={{ fontSize: '0.65rem' }}>{log.format_detected}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Lossless Raw vs Structured Canonical Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Box 1: Verbatim Raw String (Lossless Ingest) */}
          <div className="terminal-window" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="terminal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="status-dot status-dot-primary"></span>
                <span style={{ fontWeight: 700, color: '#f0f6fc' }}>BEFORE // EXACT RAW UNMODIFIED STRING</span>
              </div>
              <span className="mono" style={{ fontSize: '0.68rem', color: '#8b949e' }}>
                raw_event_id: {selectedTrace?.raw?.id ? selectedTrace.raw.id.substring(0, 16) : 'N/A'}...
              </span>
            </div>

            <div className="terminal-body" style={{ background: '#090d13', padding: '0.75rem', minHeight: '80px' }}>
              <div style={{ fontSize: '0.76rem', color: '#c9d1d9', lineHeight: 1.5, wordBreak: 'break-all' }} className="mono">
                {selectedTrace?.raw?.raw_payload || (currentLog ? "Loading verbatim raw string..." : "Select an event from the left list to trace raw string")}
              </div>
              {selectedTrace?.raw && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid #21262d', fontSize: '0.68rem', color: '#6e7681' }}>
                  <span>Source: <strong style={{ color: '#8b949e' }}>{selectedTrace.raw.source_name}</strong></span>
                  <span>Received At: <strong style={{ color: '#8b949e' }}>{selectedTrace.raw.received_at}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Canonical Normalized JSON */}
          <div className="eng-card" style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid #30363d' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f6fc' }}>
                AFTER // CANONICAL NORMALIZED SCHEMA (ISO-8601 UTC)
              </span>
              <span className="badge-tag">Normalized & Cleaned</span>
            </div>

            <div style={{ flex: 1, background: '#090d13', border: '1px solid #21262d', borderRadius: '3px', padding: '0.75rem', overflowY: 'auto' }}>
              <pre className="mono" style={{ fontSize: '0.75rem', color: '#86efac', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(selectedTrace?.normalized || currentLog || {}, null, 2)}
              </pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
