import React from 'react';
import { GitCommit, Database, Layers, Copy, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export default function PipelineMonitor({ metrics }) {
  const funnel = metrics?.funnel || {
    raw_received: 0,
    parsed: 0,
    deduplicated_collapsed: 0,
    effective_normalized_stored: 0,
    high_value_security: 0,
    low_value_noise: 0,
    threat_alerts: 0
  };

  const stages = [
    {
      step: "STAGE 01",
      name: "Lossless Raw Capture",
      desc: "Captures and stores verbatim log text unmodified in the database prior to processing.",
      count: funnel.raw_received,
      unit: "raw logs",
      status: "ACTIVE"
    },
    {
      step: "STAGE 02",
      name: "Multi-Format Parser Engine",
      desc: "Auto-detects Syslog, KV Pipe, Bracketed, JSON Lines & Custom Regex Plugins.",
      count: funnel.parsed,
      unit: "parsed records",
      status: "ACTIVE"
    },
    {
      step: "STAGE 03",
      name: "Sliding Window Deduplication",
      desc: "Collapses duplicate events within a 60-second sliding time window, incrementing dup_count.",
      count: funnel.deduplicated_collapsed,
      unit: "duplicates merged",
      status: "ACTIVE"
    },
    {
      step: "STAGE 04",
      name: "Taxonomy Normalization",
      desc: "Standardizes variant event strings to canonical taxonomy and converts timestamps to ISO-8601 UTC.",
      count: funnel.effective_normalized_stored,
      unit: "canonical events",
      status: "ACTIVE"
    },
    {
      step: "STAGE 05",
      name: "Zero-Loss Noise Classification",
      desc: "Categorizes high-value security events vs. routine system chatter without dropping data.",
      count: funnel.high_value_security,
      unit: "security events",
      status: "ACTIVE"
    },
    {
      step: "STAGE 06",
      name: "AI ML Threat & Anomaly Engine",
      desc: "Runs Scikit-Learn Isolation Forest & sequence attack rule engine for real-time triage.",
      count: funnel.threat_alerts,
      unit: "threat detections",
      status: funnel.threat_alerts > 0 ? "ALERT" : "NOMINAL"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
          Pipeline Stage Monitor & Stage Diagnostics
        </div>
        <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
          Modular breakdown of each sequential transformation stage in the Universal Log Pre-processing Framework.
        </p>
      </div>

      {/* Stages Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
        {stages.map((st) => (
          <div key={st.step} className="eng-card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6e7681' }}>{st.step}</span>
              <span className={`badge-sev ${st.status === 'ALERT' ? 'badge-sev-critical' : 'badge-sev-low'}`}>
                {st.status}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f6fc' }}>{st.name}</h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: st.status === 'ALERT' ? '#ef4444' : '#3b82f6', marginTop: '0.2rem' }} className="mono">
                {st.count.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#8b949e' }}>{st.unit}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.4, background: '#090d13', padding: '0.5rem 0.65rem', borderRadius: '2px', border: '1px solid #21262d' }}>
              {st.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
