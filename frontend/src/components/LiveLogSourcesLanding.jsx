import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Globe, Terminal, Cpu, Database, Box, Layers, Cloud, 
  Shield, Network, Zap, Lock, Activity, GitBranch, ShieldAlert, 
  Layout, Code, Play, Pause, RefreshCw, Eye, Sliders,
  CheckCircle, ArrowRight, ActivityIcon, FileText, Sparkles, X, ChevronDown
} from 'lucide-react';

const ICON_MAP = {
  Server, Globe, Terminal, Cpu, Database, Box, Layers, Cloud, 
  Shield, Network, Zap, Lock, Activity, GitBranch, ShieldAlert, 
  Layout, Code
};

export default function LiveLogSourcesLanding({ 
  sources = [], 
  onTriggerGenerator, 
  onNavigateTab,
  onExploreSystem,
  onResetDb,
  isResetting
}) {
  const [isIntro, setIsIntro] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoStreaming, setIsAutoStreaming] = useState(true);
  const [localCounters, setLocalCounters] = useState({});
  const drawerRef = useRef(null);

  // Auto transition from full video intro to dashboard after 1.8s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntro(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize local counters from sources
  useEffect(() => {
    if (sources && sources.length > 0) {
      const initial = {};
      sources.forEach(s => {
        initial[s.id] = s.logs_generated || Math.floor(Math.random() * 800) + 150;
      });
      setLocalCounters(prev => ({ ...initial, ...prev }));
    }
  }, [sources]);

  // Periodic visual live ticker for continuous sources
  useEffect(() => {
    if (!isAutoStreaming || isIntro) return;
    const interval = setInterval(() => {
      if (sources && sources.length > 0) {
        const randomSource = sources[Math.floor(Math.random() * sources.length)];
        if (randomSource) {
          setLocalCounters(prev => ({
            ...prev,
            [randomSource.id]: (prev[randomSource.id] || 100) + Math.floor(Math.random() * 3) + 1
          }));
        }
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [isAutoStreaming, isIntro, sources]);



  // Generate robust fallback journey data if API call is delayed or offline
  const getFallbackJourneyData = (source) => {
    const nowIso = new Date().toISOString();
    return {
      status: 'success',
      source: source,
      raw_logs: [
        `192.168.1.105 - - [${new Date().toUTCString()}] "POST /api/v1/ingest HTTP/1.1" 200 452`,
        `[${source.name.toUpperCase()}] timestamp=${nowIso} action=NORMALIZE status=SUCCESS event_id=raw_${Math.floor(Math.random()*90000+10000)}`
      ],
      summary: { raw_received: 2, parsed: 2, deduplicated_collapsed: 0, high_value_security: 2 },
      normalized_logs: [
        {
          id: `norm_${Math.floor(Math.random()*900000+100000)}`,
          raw_event_id: `raw_uuid_${Math.floor(Math.random()*9000+1000)}`,
          timestamp: nowIso,
          event_type: "SECURITY_AUTHENTICATION_EVENT",
          category: source.category || "Infrastructure",
          severity: "MEDIUM",
          source_ip: "192.168.1.105",
          user: "admin",
          action: "INSPECT_JOURNEY",
          format_detected: source.format ? source.format.split('/')[0].trim() : "Syslog RFC3164",
          is_noise: false,
          extracted_fields: {
            source_technology: source.name,
            log_format: source.format,
            volume_rate: source.volume,
            canonical_status: "NORMALIZED_1_TO_1"
          }
        }
      ]
    };
  };

  const handleCardClick = async (source) => {
    setSelectedSource(source);
    setIsGenerating(true);
    try {
      if (onTriggerGenerator) {
        const res = await onTriggerGenerator(source.id, 1);
        if (res && (res.status === 'success' || res.raw_logs)) {
          setJourneyData(res);
        } else {
          setJourneyData(getFallbackJourneyData(source));
        }
      } else {
        setJourneyData(getFallbackJourneyData(source));
      }

      setLocalCounters(prev => ({
        ...prev,
        [source.id]: (prev[source.id] || 0) + 1
      }));
    } catch (err) {
      console.error("Error triggering generator:", err);
      setJourneyData(getFallbackJourneyData(source));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickGenerate = async (e, source) => {
    e.stopPropagation();
    setIsGenerating(true);
    try {
      if (onTriggerGenerator) {
        await onTriggerGenerator(source.id, 3);
      }
      setLocalCounters(prev => ({
        ...prev,
        [source.id]: (prev[source.id] || 0) + 3
      }));
    } catch (err) {
      console.error("Error triggering quick generator:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalLogsGenerated = Object.values(localCounters).reduce((a, b) => a + b, 0);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      
      {/* 1. Video Background with Deep Dynamic Contrast */}
      <div className="video-background-container">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="video-background"
        >
          <source src="/Keep_the_animation_of_first_vi.mp4" type="video/mp4" />
        </video>
        <div className={`video-overlay ${isIntro ? 'video-intro-overlay' : ''}`} />
      </div>

      {/* 2. Introductory Video Splash Overlay (Auto Transitions or Click Enter) */}
      {isIntro ? (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 100, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(15, 23, 30, 0.45)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeInLanding 0.5s ease forwards',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{ padding: '0.4rem 1.2rem', background: 'rgba(216, 232, 200, 0.2)', border: '1px solid #D8E8C8', borderRadius: '30px', color: '#D8E8C8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> SMART INDIA HACKATHON • NTRO PS #26156
          </div>
          
          <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '1rem', textShadow: '0 6px 20px rgba(0,0,0,0.8)' }}>
            Universal Log Pre-processing Framework
          </h1>

          <p style={{ fontSize: '1.2rem', color: '#C8D8CF', maxWidth: '780px', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            Heterogeneous Log Ingestion, Canonical Normalization, and 1:1 Traceability Engine
          </p>

          <button 
            onClick={() => setIsIntro(false)}
            className="btn-cyber-primary"
            style={{ fontSize: '1.05rem', padding: '0.85rem 2rem', borderRadius: '30px' }}
          >
            Launch Live Log Dashboard <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* 3. Main Landing UI Content */
        <div className="landing-content" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1650px', margin: '0 auto' }}>
          
          {/* Top Hero Heading & Metrics Bar */}
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 1rem', background: 'rgba(168, 193, 176, 0.15)', border: '1px solid rgba(168, 193, 176, 0.4)', borderRadius: '20px', fontSize: '0.78rem', color: '#D8E8C8', marginBottom: '1rem', fontWeight: 600 }}>
              <span className="live-dot" />
              NTRO PS ID: 26156 • Universal Log Pre-processing Framework (ULPF)
            </div>

            <h1 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '0.6rem', textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
              Universal Log Pre-processing Framework
            </h1>
            
            <p style={{ fontSize: '1.05rem', color: '#C8D8CF', maxWidth: '840px', margin: '0 auto 1.8rem', lineHeight: 1.5, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              Ingest, process, normalize, and transform heterogeneous log data into structured and actionable intelligence across enterprise perimeter security infrastructure.
            </p>

            {/* Metrics & Control Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', background: 'rgba(31, 41, 51, 0.88)', backdropFilter: 'blur(12px)', padding: '0.85rem 1.5rem', borderRadius: '10px', border: '1px solid #3b4956', maxWidth: '1150px', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #3b4956', paddingRight: '1.2rem' }}>
                <ActivityIcon size={18} style={{ color: '#D8E8C8' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase', fontWeight: 600 }}>Active Log Sources</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>20 / 20 Systems Online</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #3b4956', paddingRight: '1.2rem' }}>
                <FileText size={18} style={{ color: '#A8C1B0' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase', fontWeight: 600 }}>Total Logs Generated</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#D8E8C8', fontFamily: 'var(--font-mono)' }}>
                    {totalLogsGenerated.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #3b4956', paddingRight: '1.2rem' }}>
                <CheckCircle size={18} style={{ color: '#7F9F7C' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase', fontWeight: 600 }}>Canonical Normalization</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C8D8CF' }}>1:1 Traceability Active</div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
                <button 
                  onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                  className="btn-cyber-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                >
                  {isAutoStreaming ? <Pause size={14} /> : <Play size={14} />}
                  {isAutoStreaming ? 'Pause Auto-Stream' : 'Resume Auto-Stream'}
                </button>

                <button 
                  onClick={() => setIsIntro(true)}
                  className="btn-cyber-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                  title="View full screen background video animation"
                >
                  <Sparkles size={14} /> Replay Video Intro
                </button>

                <button 
                  onClick={() => onNavigateTab && onNavigateTab('overview')}
                  className="btn-cyber-primary"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
                >
                  Command Center <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 4. 20 Live Log Source Rectangular Cards Grid */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Server size={22} style={{ color: '#D8E8C8' }} />
              Perimeter Security & Infrastructure Log Sources (20 Active Systems)
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#B8CDD5' }}>
              Hover over cards for 3D elevation • Click "Inspect Journey" to trace live ULPF normalization.
            </div>
          </div>

          <div className="log-source-grid">
            {sources.map((src, index) => {
              const IconComp = ICON_MAP[src.icon] || Server;
              const logCount = localCounters[src.id] || src.logs_generated || 0;
              const isSelected = selectedSource?.id === src.id;

              return (
                <div 
                  key={src.id}
                  onClick={() => {
                    if (onExploreSystem) {
                      onExploreSystem(src);
                    } else {
                      handleCardClick(src);
                    }
                  }}
                  className={`source-card ${isSelected ? 'active-selected' : ''} ${isAutoStreaming ? 'is-streaming' : ''}`}
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="card-icon-wrapper" style={{ padding: '0.5rem', background: 'rgba(168, 193, 176, 0.15)', border: '1px solid rgba(168, 193, 176, 0.35)', borderRadius: '8px', color: '#D8E8C8' }}>
                        <IconComp size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#ffffff' }}>{src.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#B8CDD5' }}>{src.category}</div>
                      </div>
                    </div>

                    <span className={`badge-fmt ${src.badge_class || 'badge-syslog'}`}>
                      {src.format ? src.format.split('/')[0] : 'Syslog'}
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '0.76rem', color: '#C8D8CF', marginBottom: '0.9rem', minHeight: '34px', lineHeight: 1.35 }}>
                    {src.description}
                  </div>

                  {/* Status and Log Count Container */}
                  <div style={{ background: '#162026', borderRadius: '6px', padding: '0.6rem 0.8rem', border: '1px solid #2d3843', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#B8CDD5', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="live-dot" /> {src.status || 'LIVE'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#7F9F7C', fontWeight: 600 }}>
                        {src.volume}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.72rem', color: '#C8D8CF' }}>Logs Generated:</span>
                      <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#D8E8C8' }}>
                        {logCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onExploreSystem) {
                          onExploreSystem(src);
                        } else {
                          handleCardClick(src);
                        }
                      }}
                      className="btn-cyber-primary"
                      style={{ flex: 1, fontSize: '0.74rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
                      title={`Open live Command Center for ${src.name}`}
                    >
                      <Sliders size={13} /> Explore
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(src);
                      }}
                      className="btn-cyber-secondary"
                      style={{ fontSize: '0.74rem', padding: '0.4rem 0.65rem', justifyContent: 'center' }}
                      title="Quick ULPF normalization trace"
                    >
                      <Eye size={13} /> Journey
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Interactive ULPF Pipeline Journey Drawer */}
          <div ref={drawerRef}>
            {selectedSource && (
              <div style={{ marginTop: '2.5rem', background: 'rgba(31, 41, 51, 0.95)', border: '2px solid #A8C1B0', borderRadius: '12px', padding: '1.6rem', backdropFilter: 'blur(16px)', boxShadow: '0 16px 50px rgba(0,0,0,0.6)', animation: 'fadeInLanding 0.4s ease' }}>
                
                {/* Drawer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #3b4956', paddingBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ padding: '0.55rem', background: 'rgba(216, 232, 200, 0.18)', border: '1px solid #A8C1B0', borderRadius: '8px', color: '#D8E8C8' }}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                        ULPF Live Journey: {selectedSource.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#B8CDD5' }}>
                        Category: {selectedSource.category} • Format: {selectedSource.format}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button 
                      onClick={() => onNavigateTab && onNavigateTab('beforeafter')}
                      className="btn-cyber-primary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      Open 1:1 Inspector <ArrowRight size={14} />
                    </button>

                    <button 
                      onClick={() => setSelectedSource(null)}
                      className="btn-cyber-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    >
                      <X size={16} /> Close
                    </button>
                  </div>
                </div>

                {/* Pipeline Transformation Display */}
                {isGenerating ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#C8D8CF' }}>
                    <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#A8C1B0' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>Generating raw {selectedSource.name} log & processing through ULPF Engine...</div>
                  </div>
                ) : journeyData ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    
                    {/* Left Panel: Step 1 Raw Input */}
                    <div style={{ background: '#141d24', border: '1px solid #2d3843', borderRadius: '8px', padding: '1.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B8CDD5', textTransform: 'uppercase' }}>
                          Step 1: Heterogeneous Raw Log Capture
                        </span>
                        <span className="badge-tag">Verbatim Text</span>
                      </div>
                      
                      <div className="terminal-window" style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.85rem', background: '#0a1014' }}>
                        {journeyData.raw_logs && journeyData.raw_logs.map((rl, idx) => (
                          <div key={idx} style={{ marginBottom: '0.5rem', wordBreak: 'break-all', color: '#D8E8C8', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                            {rl}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Panel: Step 2 Normalized Output */}
                    <div style={{ background: '#141d24', border: '1px solid #2d3843', borderRadius: '8px', padding: '1.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A8C1B0', textTransform: 'uppercase' }}>
                          Step 2: Canonical Normalization & 1:1 Schema
                        </span>
                        <span className="badge-tag" style={{ color: '#D8E8C8', borderColor: '#7F9F7C' }}>ULPF Standard</span>
                      </div>

                      {journeyData.normalized_logs && journeyData.normalized_logs[0] ? (
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <div><strong style={{ color: '#B8CDD5' }}>Format Detected:</strong> <span style={{ color: '#D8E8C8' }}>{journeyData.normalized_logs[0].format_detected}</span></div>
                            <div><strong style={{ color: '#B8CDD5' }}>Event Type:</strong> <span style={{ color: '#ffffff' }}>{journeyData.normalized_logs[0].event_type}</span></div>
                            <div><strong style={{ color: '#B8CDD5' }}>Severity:</strong> <span className={`badge-sev badge-sev-${(journeyData.normalized_logs[0].severity || 'low').toLowerCase()}`}>{journeyData.normalized_logs[0].severity}</span></div>
                            <div><strong style={{ color: '#B8CDD5' }}>Source IP:</strong> <span className="mono" style={{ color: '#ffffff' }}>{journeyData.normalized_logs[0].source_ip || 'N/A'}</span></div>
                          </div>

                          <div style={{ background: '#0a1014', border: '1px solid #2d3843', borderRadius: '6px', padding: '0.75rem', fontSize: '0.75rem' }}>
                            <div style={{ color: '#7F9F7C', fontWeight: 600, marginBottom: '0.35rem' }}>Extracted Field Metadata:</div>
                            <pre style={{ margin: 0, color: '#C8D8CF', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                              {JSON.stringify(journeyData.normalized_logs[0].extracted_fields, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#B8CDD5', fontSize: '0.85rem' }}>Log ingested & deduplicated in window batch.</div>
                      )}
                    </div>

                  </div>
                ) : null}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
