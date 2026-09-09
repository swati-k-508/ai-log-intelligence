import React from 'react';
import { Bot } from 'lucide-react';

export default function TopHeader({ rawLogCount = 0, onOpenAi }) {
  return (
    <header style={{
      background: 'var(--charcoal)',
      borderBottom: '1px solid var(--border-default)',
      padding: '0.65rem 1.25rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      {/* Title & PS ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }} className="mono">
          ULPF ENGINE <span style={{ color: 'var(--blue-grey)', fontWeight: 400 }}>// NTRO PS 26156</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--pale-sage)', borderLeft: '1px solid var(--border-default)', paddingLeft: '0.75rem' }}>
          Heterogeneous Log Normalization • 60s Sliding Window Deduplication • 1:1 Traceability
        </span>
      </div>

      {/* Telemetry Status Items & AI Quick Launcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {/* Status 1: API Online */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--dark-slate)', border: '1px solid var(--border-default)', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--pistachio-light)' }} className="mono">API: 8000 OK</span>
        </div>

        {/* Status 2: Ingested */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--dark-slate)', border: '1px solid var(--border-default)', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--blue-grey)' }}>Raw Buffer:</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--pistachio-light)' }} className="mono">{rawLogCount} logs</span>
        </div>

        {/* Status 3: ML Detector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--dark-slate)', border: '1px solid var(--border-default)', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--blue-grey)' }}>ML Detector:</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sage-green)' }} className="mono">IsolationForest</span>
        </div>

        {/* AI Copilot Quick Button */}
        {onOpenAi && (
          <button 
            onClick={onOpenAi}
            className="btn-cyber-secondary"
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <Bot size={13} color="#c084fc" /> AI Copilot
          </button>
        )}
      </div>
    </header>
  );
}
