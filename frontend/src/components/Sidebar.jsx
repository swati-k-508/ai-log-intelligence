import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Search, 
  GitCompare, 
  GitCommit, 
  ShieldAlert, 
  Sliders, 
  BarChart3, 
  RefreshCw, 
  Zap 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onResetDb, isResetting }) {
  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard, badge: 'Live' },
    { id: 'ingest', label: 'Log Ingestion', icon: UploadCloud },
    { id: 'explorer', label: 'Log Explorer', icon: Search },
    { id: 'beforeafter', label: 'Before / After', icon: GitCompare, highlight: true },
    { id: 'pipeline', label: 'Pipeline Monitor', icon: GitCommit },
    { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
    { id: 'parsers', label: 'Parser Studio', icon: Sliders },
    { id: 'analytics', label: 'Log Analytics', icon: BarChart3 },
  ];

  return (
    <aside style={{
      width: '260px',
      background: '#090e1a',
      borderRight: '1px solid #1b263b',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      zIndex: 10,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #1b263b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)'
          }}>
            <Zap color="#040914" size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.05em', color: '#f8fafc' }} className="mono">
              ASTERIA
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Log Pre-processing Engine
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        
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
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.375rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00f0ff' : '#94a3b8',
                background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#00f0ff' : '#64748b'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1b263b', background: '#070b14' }}>
        <button
          onClick={onResetDb}
          disabled={isResetting}
          className="btn-cyber-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '0.5rem' }}
          title="Reset database to clear logs and run fresh demo"
        >
          <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} />
          {isResetting ? "Resetting Database..." : "Reset Pipeline DB"}
        </button>
      </div>
    </aside>
  );
}
