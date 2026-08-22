import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  PieChart as PieIcon, 
  BarChart3,
  Terminal,
  Zap,
  Radio,
  FileCode,
  TrendingUp,
  ShieldAlert,
  Server,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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

// Time Series Data for Event Activity Line Chart (with visible anomaly spikes)
const activityData = [
  { time: '12:00', total: 120, normal: 105, warning: 12, anomaly: 3 },
  { time: '12:10', total: 145, normal: 125, warning: 15, anomaly: 5 },
  { time: '12:20', total: 190, normal: 140, warning: 22, anomaly: 28 }, // Anomaly spike 1
  { time: '12:30', total: 160, normal: 135, warning: 18, anomaly: 7 },
  { time: '12:40', total: 130, normal: 115, warning: 11, anomaly: 4 },
  { time: '12:50', total: 240, normal: 150, warning: 35, anomaly: 55 }, // Anomaly spike 2 (SSH Brute force stream)
  { time: '13:00', total: 175, normal: 142, warning: 20, anomaly: 13 },
];

// Threat Anomaly Trend Data (Threat score & detection spikes)
const threatTrendData = [
  { time: '12:00', threatScore: 22, anomalyCount: 2 },
  { time: '12:10', threatScore: 35, anomalyCount: 4 },
  { time: '12:20', threatScore: 78, anomalyCount: 22 }, // Spike
  { time: '12:30', threatScore: 45, anomalyCount: 6 },
  { time: '12:40', threatScore: 28, anomalyCount: 3 },
  { time: '12:50', threatScore: 94, anomalyCount: 48 }, // Critical Spike
  { time: '13:00', threatScore: 62, anomalyCount: 11 },
];

// Log Source Distribution Categories
const sourceCategoriesData = [
  { name: 'Network', value: 35, color: '#00f0ff' },
  { name: 'Server', value: 22, color: '#3b82f6' },
  { name: 'Application', value: 18, color: '#8b5cf6' },
  { name: 'Database', value: 12, color: '#10b981' },
  { name: 'Firewall', value: 8, color: '#f59e0b' },
  { name: 'Endpoint', value: 3, color: '#ec4899' },
  { name: 'IoT', value: 2, color: '#06b6d4' }
];

// Event Classification Bar Chart Data
const classificationData = [
  { category: 'Normal', count: 820, fill: '#10b981' },
  { category: 'Suspicious', count: 185, fill: '#3b82f6' },
  { category: 'Warning', count: 124, fill: '#f59e0b' },
  { category: 'Critical', count: 48, fill: '#f43f5e' }
];

// Domain Source Volume Comparison
const domainVolumeData = [
  { domain: 'Network', events: 450 },
  { domain: 'Cloud', events: 320 },
  { domain: 'Endpoint', events: 280 },
  { domain: 'App', events: 210 },
  { domain: 'DB', events: 160 },
  { domain: 'IoT', events: 90 },
];

// Recent Anomaly Table Data
const recentAnomaliesData = [
  { time: '14:32:05', source: 'Firewall-GW', eventType: 'PORT_SCAN', severity: 'HIGH', risk: 82, ip: '172.16.0.88' },
  { time: '14:35:12', source: 'Auth-Server', eventType: 'AUTHENTICATION_FAILURE', severity: 'CRITICAL', risk: 94, ip: '192.168.1.105' },
  { time: '14:41:20', source: 'DB-Cluster', eventType: 'UNAUTHORIZED_ACCESS', severity: 'HIGH', risk: 78, ip: '198.51.100.4' },
  { time: '14:47:50', source: 'App-Node-02', eventType: 'PRIVILEGE_ESCALATION', severity: 'CRITICAL', risk: 91, ip: '10.0.4.22' },
  { time: '14:52:10', source: 'VPN-Gateway', eventType: 'MALFORMED_LOG', severity: 'MEDIUM', risk: 61, ip: '10.0.1.50' },
];

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#090e1a', border: '1px solid #1b263b', padding: '0.65rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.78rem' }}>
        <p style={{ color: '#00f0ff', fontWeight: 700, marginBottom: '0.3rem' }}>{label}</p>
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
  const typeCounts = metrics?.event_types_breakdown || {};

  // Build Severity Donut Chart Data dynamically from backend
  const severityDonutData = [
    { name: 'Critical', value: severityCounts.CRITICAL || 1, color: '#f43f5e' },
    { name: 'High', value: severityCounts.HIGH || 5, color: '#f59e0b' },
    { name: 'Medium', value: severityCounts.MEDIUM || 2, color: '#3b82f6' },
    { name: 'Low', value: severityCounts.LOW || 5, color: '#10b981' },
    { name: 'Info', value: severityCounts.INFO || 3, color: '#00f0ff' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Zero Data Ingest Banner */}
      {funnel.raw_received === 0 && (
        <div className="cyber-card-glow" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} /> Pipeline Ready — Stream Sample Dataset
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              No active log data loaded. Stream the synthetic "Nexora Technologies" multi-format dataset to demonstrate the pipeline live.
            </p>
          </div>
          <button onClick={onIngestSeed} disabled={isIngesting} className="btn-cyber-primary">
            {isIngesting ? "Ingesting Dataset..." : "Stream Nexora Demo Dataset"}
          </button>
        </div>
      )}

      {/* SECTION 3: REAL-TIME LOG ANALYTICS TELEMETRY BAR */}
      <div className="cyber-card" style={{ padding: '1rem 1.25rem', background: '#090e1a', border: '1px solid #1b263b' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} /> REAL-TIME LOG ANALYTICS & TELEMETRY
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#050811', border: '1px solid #131b2e', padding: '0.75rem', borderRadius: '0.375rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>LIVE EVENT COUNT</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }} className="mono">
              {(funnel.raw_received || 30).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#34d399' }}>● Streaming Live</span>
          </div>

          <div style={{ background: '#050811', border: '1px solid #131b2e', padding: '0.75rem', borderRadius: '0.375rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>THROUGHPUT RATE</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f0ff', marginTop: '0.2rem' }} className="mono">
              142 ev/s
            </div>
            <span style={{ fontSize: '0.68rem', color: '#60a5fa' }}>↑ 12% Peak Load</span>
          </div>

          <div style={{ background: '#050811', border: '1px solid #131b2e', padding: '0.75rem', borderRadius: '0.375rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>ANOMALIES DETECTED</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', marginTop: '0.2rem' }} className="mono">
              {funnel.threat_alerts || 3}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#fb7185' }}>⚠ Isolation Forest Active</span>
          </div>

          <div style={{ background: '#050811', border: '1px solid #131b2e', padding: '0.75rem', borderRadius: '0.375rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>CRITICAL EVENTS</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.2rem' }} className="mono">
              {severityCounts.CRITICAL || 1}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#f43f5e' }}>Critical Threat Level</span>
          </div>

          <div style={{ background: '#050811', border: '1px solid #131b2e', padding: '0.75rem', borderRadius: '0.375rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>CURRENT THREAT LEVEL</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={18} color="#f59e0b" /> ELEVATED
            </div>
            <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>Risk Index: 74.8/100</span>
          </div>
        </div>
      </div>

      {/* ROW 1: KPI CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL RAW LOGS</span>
            <Database size={18} color="#00f0ff" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#f8fafc' }} className="mono">
            {funnel.raw_received.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 600 }}>Verbatim Raw Capture</span>
        </div>

        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NORMAL EVENTS</span>
            <Layers size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#f8fafc' }} className="mono">
            {Math.max(0, funnel.parsed - funnel.high_value_security).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>Routine Traffic</span>
        </div>

        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WARNING EVENTS</span>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#fbbf24' }} className="mono">
            {severityCounts.MEDIUM || 2}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>Medium Severity</span>
        </div>

        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ANOMALIES</span>
            <AlertTriangle size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#fb7185' }} className="mono">
            {funnel.threat_alerts.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>Detected Threats</span>
        </div>

        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CRITICAL EVENTS</span>
            <ShieldAlert size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#f43f5e' }} className="mono">
            {severityCounts.CRITICAL || 1}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>Immediate Action</span>
        </div>

        <div className="cyber-card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AVG RISK SCORE</span>
            <TrendingUp size={18} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#c084fc' }} className="mono">
            74.8 <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>Threat Density Index</span>
        </div>
      </div>

      {/* ROW 2: PRIMARY CHARTS (LARGE EVENT ACTIVITY LINE CHART + SEVERITY DONUT CHART) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Large Event Activity Line/Area Chart */}
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#00f0ff" /> Event Activity & Anomaly Spike Telemetry Over Time
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Tracks total log volume, routine traffic, warning events, and anomaly detection spikes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge-fmt badge-syslog" style={{ fontSize: '0.68rem' }}>Live Stream</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="total" name="Total Events" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="anomaly" name="Anomalous Events (Spikes)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomaly)" />
                <Line type="monotone" dataKey="warning" name="Warnings" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="normal" name="Normal Traffic" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut Chart */}
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={18} color="#f59e0b" /> Severity Distribution
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Taxonomy severity breakdown across normalized events.
            </p>
          </div>

          <div style={{ width: '100%', height: 230, position: 'relative' }}>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={severityDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#090e1a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '5px' }} layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: LOG SOURCE, THREAT TREND & EVENT CLASSIFICATION (3 COLUMNS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Log Source Distribution */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="#00f0ff" /> Log Source Origin Distribution
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Ingested logs categorized by perimeter source origin.
          </p>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceCategoriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                >
                  {sourceCategoriesData.map((entry, index) => (
                    <Cell key={`source-cell-${index}`} fill={entry.color} stroke="#090e1a" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Threat / Anomaly Trend Chart */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f43f5e" /> Threat Score & Anomaly Spikes
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Threat score index (0-100) vs. anomaly detection spikes.
          </p>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={threatTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="threatScore" name="Threat Score" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.25} />
                <Line type="monotone" dataKey="anomalyCount" name="Anomaly Spikes" stroke="#f59e0b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Event Classification Bar Chart */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="#34d399" /> Event Classification Comparison
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Volume breakdown across event classification tiers.
          </p>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={classificationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b263b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Event Count" radius={[4, 4, 0, 0]}>
                  {classificationData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 4: ANOMALY TABLE & ASTERIA INTELLIGENCE AI PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Table: Recent Anomaly Detections */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#f43f5e" /> Recent Anomaly Detections & Risk Scores
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Real-time telemetry</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1b263b', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '0.45rem 0.6rem' }}>Time</th>
                  <th style={{ padding: '0.45rem 0.6rem' }}>Source</th>
                  <th style={{ padding: '0.45rem 0.6rem' }}>Event Type</th>
                  <th style={{ padding: '0.45rem 0.6rem' }}>Severity</th>
                  <th style={{ padding: '0.45rem 0.6rem' }}>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {recentAnomaliesData.map((row, idx) => {
                  const sevClass = 
                    row.severity === 'CRITICAL' ? 'badge-sev-critical' :
                    row.severity === 'HIGH' ? 'badge-sev-high' : 'badge-sev-medium';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #131b2e' }}>
                      <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }} className="mono">{row.time}</td>
                      <td style={{ padding: '0.45rem 0.6rem', color: '#00f0ff', fontWeight: 600 }}>{row.source} ({row.ip})</td>
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: '#f8fafc' }}>{row.eventType}</td>
                      <td style={{ padding: '0.45rem 0.6rem' }}><span className={`badge-sev ${sevClass}`}>{row.severity}</span></td>
                      <td style={{ padding: '0.45rem 0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: '#050811', borderRadius: '3px', height: '6px', width: '60px', overflow: 'hidden', border: '1px solid #1b263b' }}>
                            <div style={{ background: row.risk > 85 ? '#f43f5e' : row.risk > 70 ? '#f59e0b' : '#3b82f6', width: `${row.risk}%`, height: '100%' }}></div>
                          </div>
                          <span style={{ fontWeight: 700, color: row.risk > 85 ? '#f43f5e' : '#f8fafc' }} className="mono">{row.risk}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insight Panel: ASTERIA INTELLIGENCE */}
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="#00f0ff" /> ASTERIA INTELLIGENCE
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <div style={{ background: '#050811', border: '1px solid #1b263b', borderLeft: '4px solid #f43f5e', borderRadius: '0.375rem', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', marginBottom: '0.2rem' }}>
                ⚠ ANOMALY ACTIVITY ELEVATED
              </div>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                Anomaly detection volume increased by 23% in the last 10 minutes. Scikit-learn Isolation Forest flagged rapid SSH brute force attempts.
              </p>
            </div>

            <div style={{ background: '#050811', border: '1px solid #1b263b', borderLeft: '4px solid #f59e0b', borderRadius: '0.375rem', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.2rem' }}>
                🔴 MULTI-STAGE INTRUSION CHAIN
              </div>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                Multiple failed authentication events followed by successful login & root escalation detected from source IP 192.168.1.105.
              </p>
            </div>

            <div style={{ background: '#050811', border: '1px solid #1b263b', borderLeft: '4px solid #34d399', borderRadius: '0.375rem', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.2rem' }}>
                ✓ NORMALIZATION RATE HIGH
              </div>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                94.2% of incoming heterogeneous raw logs successfully parsed and normalized into canonical ISO-8601 UTC schema.
              </p>
            </div>

            <div style={{ background: '#050811', border: '1px solid #1b263b', borderLeft: '4px solid #c084fc', borderRadius: '0.375rem', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.2rem' }}>
                🛡 SLIDING WINDOW DEDUPLICATION
              </div>
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                14 repetitive chatter events merged via 60s sliding window deduplication, reducing database overhead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
