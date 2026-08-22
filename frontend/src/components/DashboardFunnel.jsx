import React from 'react';
import { 
  Database, 
  Layers, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  VolumeX, 
  AlertTriangle,
  ArrowRight,
  PieChart as PieIcon
} from 'lucide-react';

export default function DashboardFunnel({ metrics, onIngestSeed, isIngesting }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner if no data */}
      {funnel.raw_received === 0 && (
        <div className="glass-panel-accent" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#60a5fa' }}>Pipeline Ready for Ingestion</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              No log data currently loaded. Stream the synthetic "Nexora Technologies" multi-format dataset to test the framework live.
            </p>
          </div>
          <button onClick={onIngestSeed} disabled={isIngesting} className="btn-primary">
            {isIngesting ? "Streaming Dataset..." : "Stream Nexora Demo Dataset"}
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Raw Logs Ingested</span>
            <Database size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#f8fafc' }}>
            {funnel.raw_received}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lossless Verbatim Capture</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Formats Parsed</span>
            <Layers size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#f8fafc' }}>
            {funnel.parsed}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>Multi-Schema Auto-Detect</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Deduplicated</span>
            <Copy size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#a78bfa' }}>
            {funnel.deduplicated_collapsed}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>60s Sliding Window Collapsed</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Normalized Stored</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#34d399' }}>
            {funnel.effective_normalized_stored}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Canonical Schema Database</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Security Events</span>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#fbbf24' }}>
            {funnel.high_value_security}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>High Priority Analytics</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>AI Threat Flags</span>
            <AlertTriangle size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem', color: '#fb7185' }}>
            {funnel.threat_alerts}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f43f5e' }}>Sequence & ML Anomalies</span>
        </div>
      </div>

      {/* Visual Pipeline Funnel Flow */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} color="#3b82f6" /> Log Pre-processing Transformation Funnel
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Stage 1 */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STAGE 1</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3b82f6', marginTop: '0.2rem' }}>Raw Lossless Capture</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>{funnel.raw_received} logs</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Assigned UUID v4</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }} className="hidden-mobile">
            <ArrowRight color="#334155" size={24} />
          </div>

          {/* Stage 2 */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STAGE 2</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#06b6d4', marginTop: '0.2rem' }}>Multi-Format Parse</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>{funnel.parsed} parsed</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Safe Fallback Error Recovery</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }} className="hidden-mobile">
            <ArrowRight color="#334155" size={24} />
          </div>

          {/* Stage 3 */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STAGE 3 & 4</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981', marginTop: '0.2rem' }}>Dedupe & Normalize</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>{funnel.effective_normalized_stored} events</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.3rem' }}>-{funnel.deduplicated_collapsed} duplicates merged</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }} className="hidden-mobile">
            <ArrowRight color="#334155" size={24} />
          </div>

          {/* Stage 4 */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STAGE 5 & 6</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f43f5e', marginTop: '0.2rem' }}>Noise Filter & AI ML</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>{funnel.threat_alerts} threat alerts</div>
            <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '0.3rem' }}>{funnel.low_value_noise} chatter queryable</div>
          </div>
        </div>
      </div>

      {/* Format & Severity Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Format Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={18} color="#06b6d4" /> Format Auto-Detection Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.keys(formatCounts).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No parsed log format data available yet.</p>
            )}
            {Object.entries(formatCounts).map(([fmt, count]) => {
              const pct = funnel.parsed > 0 ? Math.round((count / funnel.parsed) * 100) : 0;
              return (
                <div key={fmt} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#e2e8f0' }} className="mono">{fmt}</span>
                    <span style={{ color: '#94a3b8' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#06b6d4', width: `${pct}%`, height: '100%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="#f59e0b" /> Normalized Severity Taxonomy
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.keys(severityCounts).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No severity taxonomy data available yet.</p>
            )}
            {Object.entries(severityCounts).map(([sev, count]) => {
              const badgeClass = 
                sev === 'CRITICAL' ? 'badge-critical' :
                sev === 'HIGH' ? 'badge-high' :
                sev === 'MEDIUM' ? 'badge-medium' : 'badge-low';
              return (
                <div key={sev} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.85rem 1.1rem', flex: '1 1 120px' }}>
                  <span className={`badge ${badgeClass}`}>{sev}</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem' }}>{count}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Normalized events</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
