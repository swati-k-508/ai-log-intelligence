import React from 'react';
import { Cpu, Database, Layers, Radio } from 'lucide-react';

export default function TopHeader({ rawLogCount = 0 }) {
  return (
    <header style={{
      background: '#090e1a',
      borderBottom: '1px solid #1b263b',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      {/* Product Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }} className="mono">
              ASTERIA <span style={{ color: '#00f0ff', fontWeight: 400 }}>ENGINE</span>
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Universal Log Pre-processing Framework — Lossless Ingest, Taxonomy Normalization & Threat Analytics
          </p>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Status 1: Pipeline Online */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#070b14', border: '1px solid #1b263b', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
          <span className="pulse-dot pulse-dot-green"></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>PIPELINE ONLINE</span>
        </div>

        {/* Status 2: Logs Ingested */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#070b14', border: '1px solid #1b263b', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
          <Radio size={14} color="#00f0ff" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ingested: </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f0ff' }} className="mono">{rawLogCount} events</span>
        </div>

        {/* Status 3: Parser Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#070b14', border: '1px solid #1b263b', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
          <Layers size={14} color="#3b82f6" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Parser: </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>Auto-Detect Active</span>
        </div>

        {/* Status 4: Detection Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#070b14', border: '1px solid #1b263b', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
          <Cpu size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ML Detector: </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>Isolation Forest</span>
        </div>

        {/* Status 5: Database */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#070b14', border: '1px solid #1b263b', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
          <Database size={14} color="#10b981" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Database: </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>SQLite Storage</span>
        </div>
      </div>
    </header>
  );
}
