import React from 'react';
import { ShieldAlert, AlertTriangle, Cpu, Terminal, User, Network, Clock, ArrowRight } from 'lucide-react';

export default function SecurityAlerts({ alerts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="cyber-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={22} color="#f43f5e" /> ASTERIA AI Threat & Anomaly Console ({alerts.length})
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Real-time security threats flagged by scikit-learn Isolation Forest ML & Attack Sequence Rule Engine.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge-sev badge-sev-critical">{alerts.filter(a => a.severity === 'CRITICAL').length} Critical Threats</span>
          <span className="badge-sev badge-sev-high">{alerts.filter(a => a.severity === 'HIGH').length} High Threats</span>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="cyber-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <ShieldAlert size={48} color="#1e293b" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#94a3b8' }}>No Active Threat Alerts Detected</h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
            Ingest raw perimeter logs containing attack scenarios to trigger real-time AI security detections.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isMlAnomaly = alert.threat_type === 'ISOLATION_FOREST_ANOMALY';

          return (
            <div 
              key={alert.id} 
              className="cyber-card" 
              style={{ 
                padding: '1.25rem', 
                borderLeft: `4px solid ${isCritical ? '#f43f5e' : '#f59e0b'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className={`badge-sev ${isCritical ? 'badge-sev-critical' : 'badge-sev-high'}`}>
                    {alert.severity} THREAT
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
                    {alert.title}
                  </h3>
                </div>
                <div style={{ background: isMlAnomaly ? 'rgba(139, 92, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)', padding: '0.45rem', borderRadius: '0.375rem' }}>
                  {isMlAnomaly ? <Cpu size={20} color="#c084fc" /> : <AlertTriangle size={20} color="#fb7185" />}
                </div>
              </div>

              {/* Attack Sequence Flow Visualization (if multi-stage) */}
              {alert.threat_type === 'BRUTE_FORCE_PRIV_ESCALATION' && (
                <div style={{ background: '#050811', border: '1px solid #1b263b', borderRadius: '0.375rem', padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Detected Attack Sequence Chain:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: '#fb7185' }}>AUTH FAILURE</span>
                    <ArrowRight size={12} color="#64748b" />
                    <span style={{ color: '#34d399' }}>AUTH SUCCESS</span>
                    <ArrowRight size={12} color="#64748b" />
                    <span style={{ color: '#f43f5e' }}>PRIVILEGE ESCALATION</span>
                  </div>
                </div>
              )}

              {/* Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: '#070b14', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                  <Network size={14} color="#00f0ff" />
                  <span>Source IP: </span>
                  <span style={{ fontWeight: 700, color: '#00f0ff' }} className="mono">{alert.source_ip || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                  <User size={14} color="#60a5fa" />
                  <span>Target User: </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{alert.target_user || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                  <Terminal size={14} color="#34d399" />
                  <span>Trigger Events: </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{alert.event_count}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                  <Clock size={14} color="#c084fc" />
                  <span>Detected: </span>
                  <span style={{ color: '#94a3b8' }} className="mono">{alert.created_at.split('T')[1]?.replace('Z', '')}</span>
                </div>
              </div>

              {/* Plain Language Explanation Box */}
              <div style={{ background: '#050811', border: '1px solid #1b263b', borderRadius: '0.375rem', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f0ff', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Plain-Language AI Threat Analysis:
                </div>
                <p style={{ fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {alert.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
