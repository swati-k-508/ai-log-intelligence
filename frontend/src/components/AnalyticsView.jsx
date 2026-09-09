import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#090d13', border: '1px solid #30363d', padding: '0.5rem 0.75rem', borderRadius: '3px', fontSize: '0.75rem' }}>
        <p style={{ color: '#f0f6fc', fontWeight: 600, marginBottom: '0.25rem' }} className="mono">{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', color: entry.color || entry.fill }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 700 }} className="mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsView({ metrics }) {
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
  const typeCounts = metrics?.event_types_breakdown || {};

  const formatData = Object.entries(formatCounts).map(([fmt, val]) => ({
    name: fmt,
    count: val
  }));

  const severityData = [
    { name: 'CRITICAL', count: severityCounts.CRITICAL || 1, fill: '#ef4444' },
    { name: 'HIGH', count: severityCounts.HIGH || 5, fill: '#f59e0b' },
    { name: 'MEDIUM', count: severityCounts.MEDIUM || 2, fill: '#3b82f6' },
    { name: 'LOW', count: severityCounts.LOW || 5, fill: '#6e7681' },
    { name: 'INFO', count: severityCounts.INFO || 3, fill: '#484f58' }
  ];

  const typeData = Object.entries(typeCounts).map(([et, val]) => ({
    name: et,
    count: val
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
          Taxonomy & Log Distribution Analytics
        </div>
        <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
          Analytical breakdown of auto-detected schema formats, normalized severity tiers, and canonical event types.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0.75rem' }}>
        
        {/* Format Auto-Detection Volume */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.75rem' }}>
            Format Ingestion Volume
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={formatData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#21262d" vertical={false} />
                <XAxis dataKey="name" stroke="#6e7681" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#6e7681" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Parsed Logs" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Taxonomy Breakdown */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.75rem' }}>
            Severity Taxonomy Breakdown
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={severityData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#21262d" vertical={false} />
                <XAxis dataKey="name" stroke="#6e7681" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="#6e7681" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Normalized Events" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Canonical Event Type Volume */}
        <div className="eng-card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.75rem' }}>
            Canonical Event Type Taxonomy
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical" margin={{ top: 8, right: 12, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#21262d" horizontal={false} />
                <XAxis type="number" stroke="#6e7681" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis dataKey="name" type="category" stroke="#6e7681" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Event Count" fill="#3b82f6" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
