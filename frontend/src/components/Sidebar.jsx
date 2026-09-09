import React from 'react';
import { 
  Activity,
  LayoutDashboard, 
  UploadCloud, 
  Search, 
  GitCompare, 
  GitCommit, 
  ShieldAlert, 
  Sliders, 
  BarChart3, 
  RefreshCw,
  Bot
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, selectedSystem, onResetDb, isResetting }) {
  const systemShortName = selectedSystem?.name ? (selectedSystem.name.length > 12 ? selectedSystem.name.substring(0, 11) + '..' : selectedSystem.name) : 'System';
  const navItems = [
    { id: 'landing', label: 'Live Log Sources', icon: Activity, isFeatured: true },
    { id: 'system_center', label: `${systemShortName} Deck`, icon: Sliders, isSystem: true },
    { id: 'overview', label: 'Global Command', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Security Copilot', icon: Bot, isAi: true },
    { id: 'ingest', label: 'Log Ingestion', icon: UploadCloud },
    { id: 'explorer', label: 'Log Explorer', icon: Search },
    { id: 'beforeafter', label: 'Before / After Trace', icon: GitCompare },
    { id: 'pipeline', label: 'Pipeline Stages', icon: GitCommit },
    { id: 'alerts', label: 'Threat Alerts', icon: ShieldAlert },
    { id: 'parsers', label: 'Parser Studio', icon: Sliders },
    { id: 'analytics', label: 'Taxonomy Analytics', icon: BarChart3 },
  ];

  return (
    <aside style={{
      width: '240px',
      background: 'var(--charcoal)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      zIndex: 10,
      flexShrink: 0
    }}>
      {/* Hackathon Engineering Header */}
      <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'rgba(168, 193, 176, 0.15)',
            border: '1px solid var(--sage-green)',
            color: 'var(--pistachio-light)',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800
          }} className="mono">
            //
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="mono">
              ASTERIA <span style={{ fontSize: '0.65rem', color: 'var(--blue-grey)', fontWeight: 500 }}>v1.5</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--pale-sage)', fontWeight: 500 }}>
              ULPF Core Engine • NTRO
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--blue-grey)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.35rem 0.6rem' }}>
          Platform Navigation
        </div>

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
                padding: '0.5rem 0.65rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--pistachio-light)' : 'var(--pale-sage)',
                background: isActive ? 'rgba(168, 193, 176, 0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--pistachio-light)' : '3px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Icon size={16} color={isActive ? 'var(--pistachio-light)' : (item.isFeatured ? 'var(--sage-green)' : (item.isAi ? '#c084fc' : 'var(--blue-grey)'))} />
                <span>{item.label}</span>
              </div>
              {item.isFeatured && (
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  background: 'rgba(216, 232, 200, 0.2)',
                  color: 'var(--pistachio-light)',
                  border: '1px solid var(--sage-green)',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '3px'
                }} className="mono">
                  LIVE
                </span>
              )}
              {item.isSystem && (
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '3px'
                }} className="mono">
                  DECK
                </span>
              )}
              {item.isAi && (
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '3px'
                }} className="mono">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Database Reset Action Panel */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-default)', background: 'var(--dark-slate)' }}>
        <button
          onClick={onResetDb}
          disabled={isResetting}
          className="btn-cyber-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.45rem' }}
          title="Reset database to clear logs and run fresh demo"
        >
          <RefreshCw size={13} className={isResetting ? "animate-spin" : ""} />
          {isResetting ? "Resetting DB..." : "Flush & Reset DB"}
        </button>
      </div>
    </aside>
  );
}
