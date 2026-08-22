import React from 'react';
import { BarChart3, PieChart as PieIcon, ShieldCheck, FileCode, Layers, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const formatColors = {
  SYSLOG: '#3b82f6',
  KV_PIPE: '#06b6d4',
  BRACKETED: '#8b5cf6',
  JSON_LINES: '#10b981',
  PALO_ALTO_CSV: '#f59e0b',
  MALFORMED_OR_UNKNOWN: '#f43f5e'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#090e1a', border: '1px solid #1b263b', padding: '0.65rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.78rem' }}>
        <p style={{ color: '#00f0ff', fontWeight: 700, marginBottom: '0.3rem' }}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ color: entry.color || entry.fill, display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
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
    value: val,
    color: formatColors[fmt] || '#00f0ff'
  }));

  const severityData = [
    { name: 'Critical', value: severityCounts.CRITICAL || 1, fill: '#f43f5e' },
    { name: 'High', value: severityCounts.HIGH || 5, fill: '#f59e0b' },
    { name: 'Medium', value: severityCounts.MEDIUM || 2, fill: '#3b82f6' },
    { name: 'Low', value: severityCounts.LOW || 5, fill: '#10b981' },
    { name: 'Info', value: severityCounts.INFO || 3, fill: '#00f0ff' }
  ];

  const typeData = Object.entries(typeCounts).map(([et, val]) => ({
    name: et,
    count: val
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="cyber-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={22} color="#00f0ff" /> ASTERIA Advanced Log Analytics & Taxonomy Dashboard
        </h2>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Analytical metrics for log schema breakdown, severity distribution, event taxonomy, and noise reduction ratio.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Format Breakdown Chart */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode size={18} color="#00f0ff" /> Format Auto-Detection Analytics
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={formatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {formatData.map((entry, index) => (
                    <Cell key={`fmt-cell-${index}`} fill={entry.color} stroke="#090e1a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Taxonomy Distribution */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#f59e0b" /> Severity Taxonomy Bar Distribution
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Normalized Events" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`sev-bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Type Taxonomy Breakdown */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#34d399" /> Event Type Taxonomy Volume
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Event Count" fill="#00f0ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
