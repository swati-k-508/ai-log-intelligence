import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function SecurityAlerts({ alerts }) {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card-alert" style={{ padding: '0.85rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AlertTriangle size={16} color="#ef4444" /> AI Threat & Anomaly Triage Console ({alerts.length})
          </div>
          <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
            Real-time security threats flagged by Scikit-Learn Isolation Forest ML & Attack Sequence Rule Engine.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <span className="badge-sev badge-sev-critical">{criticalCount} Critical</span>
          <span className="badge-sev badge-sev-high">{highCount} High</span>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="eng-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#6e7681' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8b949e' }}>No Active Threat Alerts Detected</div>
          <p style={{ fontSize: '0.75rem', color: '#6e7681', marginTop: '0.25rem' }}>
            Ingest raw perimeter logs containing attack scenarios to trigger real-time AI security detections.
          </p>
        </div>
      )}

      {/* Alerts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.75rem' }}>
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';

          return (
            <div 
              key={alert.id} 
              className="eng-card" 
              style={{ 
                padding: '1rem', 
                borderLeft: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className={`badge-sev ${isCritical ? 'badge-sev-critical' : 'badge-sev-high'}`}>
                    {alert.severity} THREAT
                  </span>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f6fc', marginTop: '0.35rem' }}>
                    {alert.title}
                  </h3>
                </div>
                <span className="badge-tag" style={{ fontSize: '0.65rem' }}>
                  {alert.threat_type}
                </span>
              </div>

              {/* Attack Sequence Flow Visualization */}
              {alert.threat_type === 'BRUTE_FORCE_PRIV_ESCALATION' && (
                <div style={{ background: '#090d13', border: '1px solid #21262d', borderRadius: '2px', padding: '0.45rem 0.65rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6e7681', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Correlated Attack Sequence:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600 }} className="mono">
                    <span style={{ color: '#ef4444' }}>AUTH FAILURE</span>
                    <ArrowRight size={11} color="#6e7681" />
                    <span style={{ color: '#3b82f6' }}>AUTH SUCCESS</span>
                    <ArrowRight size={11} color="#6e7681" />
                    <span style={{ color: '#ef4444' }}>PRIV ESCALATION</span>
                  </div>
                </div>
              )}

              {/* Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', background: '#090d13', padding: '0.6rem', borderRadius: '2px', fontSize: '0.74rem' }}>
                <div style={{ color: '#8b949e' }}>
                  <span>Source IP: </span>
                  <span style={{ fontWeight: 700, color: '#3b82f6' }} className="mono">{alert.source_ip || 'N/A'}</span>
                </div>
                <div style={{ color: '#8b949e' }}>
                  <span>Target User: </span>
                  <span style={{ fontWeight: 600, color: '#f0f6fc' }}>{alert.target_user || 'N/A'}</span>
                </div>
                <div style={{ color: '#8b949e' }}>
                  <span>Trigger Events: </span>
                  <span style={{ fontWeight: 700, color: '#f0f6fc' }} className="mono">{alert.event_count}</span>
                </div>
                <div style={{ color: '#8b949e' }}>
                  <span>Detected: </span>
                  <span style={{ color: '#8b949e' }} className="mono">{alert.created_at?.split('T')[1]?.replace('Z', '')}</span>
                </div>
              </div>

              {/* Plain Language Analysis */}
              <div style={{ background: '#090d13', border: '1px solid #21262d', borderRadius: '2px', padding: '0.65rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8b949e', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Threat Assessment:
                </div>
                <p style={{ fontSize: '0.76rem', color: '#c9d1d9', lineHeight: 1.45 }}>
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
