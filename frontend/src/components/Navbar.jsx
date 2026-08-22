import React from 'react';
import { 
  BarChart3, 
  Eye, 
  ShieldAlert, 
  Sliders, 
  UploadCloud, 
  Cpu, 
  RefreshCw 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onResetDb, isResetting }) {
  const navItems = [
    { id: 'funnel', label: 'Pipeline Overview & Funnel', icon: BarChart3 },
    { id: 'inspector', label: 'Before / After Inspector', icon: Eye },
    { id: 'alerts', label: 'AI Threat Alerts', icon: ShieldAlert },
    { id: 'parsers', label: 'Plug-and-Play Parser Studio', icon: Sliders },
    { id: 'ingest', label: 'Ingest Data Studio', icon: UploadCloud },
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem' }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
              width: '42px', 
              height: '42px', 
              borderRadius: '0.6rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)'
            }}>
              <Cpu color="white" size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  ULPF <span style={{ color: '#3b82f6', fontWeight: 400 }}>Engine</span>
                </h1>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Universal Log Pre-processing Framework — Lossless Ingest, Taxonomy Normalization & AI Threat Analytics
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={onResetDb} 
              disabled={isResetting}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              title="Reset database logs to start clean demo run"
            >
              <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} />
              {isResetting ? "Resetting..." : "Reset Pipeline DB"}
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <nav style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', overflowX: 'auto', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isActive ? '#3b82f6' : '#94a3b8'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
