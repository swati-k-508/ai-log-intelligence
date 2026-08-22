import React from 'react';
import { GitCommit, Database, Layers, Copy, CheckCircle2, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

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
      step: "STAGE 1",
      name: "Lossless Raw Capture",
      desc: "Stores raw log text verbatim in database before any modification.",
      count: funnel.raw_received,
      unit: "raw logs captured",
      status: "ACTIVE",
      icon: Database,
      color: "#00f0ff"
    },
    {
      step: "STAGE 2",
      name: "Multi-Format Parser Engine",
      desc: "Auto-detects Syslog, KV Pipe, Bracketed, JSON Lines & Custom Config Plugins.",
      count: funnel.parsed,
      unit: "parsed logs",
      status: "ACTIVE",
      icon: Layers,
      color: "#60a5fa"
    },
    {
      step: "STAGE 3",
      name: "Sliding Window Deduplication",
      desc: "Collapses duplicate identical events within a 60-second sliding time window.",
      count: funnel.deduplicated_collapsed,
      unit: "duplicates merged",
      status: "ACTIVE",
      icon: Copy,
      color: "#c084fc"
    },
    {
      step: "STAGE 4",
      name: "Taxonomy Normalization",
      desc: "Maps variant phrases to canonical schema and standardizes timestamps to ISO UTC.",
      count: funnel.effective_normalized_stored,
      unit: "canonical events",
      status: "ACTIVE",
      icon: CheckCircle2,
      color: "#34d399"
    },
    {
      step: "STAGE 5",
      name: "Zero Data Loss Noise Filter",
      desc: "Tags low-value system chatter vs. high-value security events without dropping data.",
      count: funnel.high_value_security,
      unit: "security events",
      status: "ACTIVE",
      icon: ShieldCheck,
      color: "#fbbf24"
    },
    {
      step: "STAGE 6",
      name: "AI ML Anomaly & Threat Engine",
      desc: "Runs Scikit-Learn Isolation Forest & sequence attack rule engine.",
      count: funnel.threat_alerts,
      unit: "threat alerts",
      status: funnel.threat_alerts > 0 ? "ALERT" : "NOMINAL",
      icon: Cpu,
      color: "#fb7185"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="cyber-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <GitCommit size={22} color="#00f0ff" /> ASTERIA Pipeline Stage Monitor & Diagnostics
        </h2>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Deep-dive monitoring into each modular pre-processing transformation stage in the log processing framework.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {stages.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.step} className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }} className="mono">{st.step}</span>
                <span className={`badge-sev ${st.status === 'ALERT' ? 'badge-sev-critical' : 'badge-sev-low'}`}>
                  {st.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.6rem', borderRadius: '0.375rem' }}>
                  <Icon size={22} color={st.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{st.name}</h3>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: st.color, marginTop: '0.1rem' }} className="mono">
                    {st.count.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>{st.unit}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, background: '#050811', padding: '0.65rem', borderRadius: '0.25rem', border: '1px solid #1b263b' }}>
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
