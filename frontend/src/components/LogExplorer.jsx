import React, { useState } from 'react';
import { Search, Filter, VolumeX, Volume2 } from 'lucide-react';

export default function LogExplorer({ logs, onSelectLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [hideNoise, setHideNoise] = useState(false);

  const filteredLogs = logs.filter(l => {
    if (hideNoise && l.is_noise) return false;
    if (eventTypeFilter && l.event_type !== eventTypeFilter) return false;
    if (severityFilter && l.severity !== severityFilter) return false;
    if (formatFilter && l.format_detected !== formatFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchIp = l.source_ip?.toLowerCase().includes(term);
      const matchUser = l.user?.toLowerCase().includes(term);
      const matchType = l.event_type?.toLowerCase().includes(term);
      const matchFormat = l.format_detected?.toLowerCase().includes(term);
      if (!matchIp && !matchUser && !matchType && !matchFormat) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header & Controls Bar */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
            Structured Event Explorer ({filteredLogs.length} matching)
          </div>
          <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>
            Normalized canonical events stored in SQLite database. Click any row to inspect 1:1 raw trace.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
      </div>

      {/* Filter Control Inputs */}
      <div className="eng-card" style={{ padding: '0.65rem 0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} color="#6e7681" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="eng-input"
            placeholder="Search IP, user, event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2rem', fontSize: '0.78rem' }}
          />
        </div>

        <select 
          className="eng-input" 
          value={formatFilter} 
          onChange={(e) => setFormatFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '0.78rem' }}
        >
          <option value="">All Formats</option>
          <option value="SYSLOG">SYSLOG</option>
          <option value="KV_PIPE">KV_PIPE</option>
          <option value="BRACKETED">BRACKETED</option>
          <option value="JSON_LINES">JSON_LINES</option>
          <option value="PALO_ALTO_CSV">PALO_ALTO_CSV</option>
        </select>

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
      </div>

      {/* High Density Forensic Table */}
      <div className="eng-card" style={{ overflowX: 'auto' }}>
        <table className="eng-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Severity</th>
              <th>Canonical Event Type</th>
              <th>Category</th>
              <th>Source IP</th>
              <th>User</th>
              <th>Action</th>
              <th>Format</th>
              <th>Duplicates</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#6e7681' }}>
                  No matching log events found in index.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => {
                const sevClass = 
                  l.severity === 'CRITICAL' ? 'badge-sev-critical' :
                  l.severity === 'HIGH' ? 'badge-sev-high' :
                  l.severity === 'MEDIUM' ? 'badge-sev-medium' : 'badge-sev-low';

                const fmtClass = 
                  l.format_detected === 'SYSLOG' ? 'badge-syslog' :
                  l.format_detected === 'JSON_LINES' ? 'badge-json' : 'badge-kv';

                return (
                  <tr key={l.id} onClick={() => onSelectLog(l.id)} style={{ cursor: 'pointer' }} title="Click to view 1:1 trace">
                    <td className="mono" style={{ color: '#8b949e', fontSize: '0.74rem' }}>
                      {l.timestamp}
                    </td>
                    <td>
                      <span className={`badge-sev ${sevClass}`}>{l.severity}</span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.74rem' }}>
                      {l.event_type}
                    </td>
                    <td style={{ color: '#8b949e' }}>
                      {l.category}
                    </td>
                    <td className="mono" style={{ color: '#3b82f6' }}>
                      {l.source_ip || '-'}
                    </td>
                    <td style={{ color: '#c9d1d9' }}>
                      {l.user || '-'}
                    </td>
                    <td style={{ color: l.action === 'DENY' || l.action === 'DROP' ? '#ef4444' : '#8b949e' }}>
                      {l.action || '-'}
                    </td>
                    <td>
                      <span className={`badge-fmt ${fmtClass}`}>{l.format_detected}</span>
                    </td>
                    <td className="mono" style={{ color: l.dup_count > 1 ? '#3b82f6' : '#6e7681', fontWeight: l.dup_count > 1 ? 700 : 400 }}>
                      {l.dup_count > 1 ? `x${l.dup_count}` : '1'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
