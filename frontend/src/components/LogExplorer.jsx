import React, { useState } from 'react';
import { Search, Filter, VolumeX, Volume2, Database, Table } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="cyber-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Table size={22} color="#00f0ff" /> ASTERIA Log Explorer Console ({filteredLogs.length})
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Query, filter, and inspect structured normalized events in real-time.
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="cyber-card" style={{ padding: '0.85rem 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="cyber-input"
              placeholder="Search IP, User, Event Type, Format..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select 
            className="cyber-input" 
            value={formatFilter} 
            onChange={(e) => setFormatFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Formats</option>
            <option value="SYSLOG">SYSLOG</option>
            <option value="KV_PIPE">KV_PIPE</option>
            <option value="BRACKETED">BRACKETED</option>
            <option value="JSON_LINES">JSON_LINES</option>
            <option value="PALO_ALTO_CSV">PALO_ALTO_CSV</option>
          </select>

          <select 
            className="cyber-input" 
            value={eventTypeFilter} 
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ width: 'auto' }}
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

      {/* Explorer Data Grid */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1b263b', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Severity</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Canonical Event Type</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Category</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Source IP</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Target User</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Action</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Format</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No events match the specified search and filter criteria.
                  </td>
                </tr>
              )}
              {filteredLogs.map((l) => {
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
                    onClick={() => onSelectLog && onSelectLog(l.id)}
                    style={{ borderBottom: '1px solid #131b2e', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }} className="mono">
                      {l.timestamp ? l.timestamp.replace('Z', '').replace('T', ' ') : '--:--:--'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span className={`badge-sev ${sevClass}`}>{l.severity}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                      {l.event_type}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#60a5fa' }}>
                      {l.category}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#00f0ff' }} className="mono">
                      {l.source_ip || 'N/A'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0' }}>
                      {l.user || 'N/A'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: l.action === 'DENY' || l.action === 'DROP' ? '#fb7185' : '#34d399' }}>
                      {l.action}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span className={`badge-fmt ${fmtClass}`}>{l.format_detected}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: l.dup_count > 1 ? '#c084fc' : '#64748b' }} className="mono">
                      {l.dup_count > 1 ? `x${l.dup_count}` : '1'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
