import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ShieldAlert,
  Clock,
  Activity,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  ChevronRight,
  Server,
  User,
  Globe,
  Radio,
  Eye,
  FileCheck,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot
} from 'recharts';

const API_BASE = 'http://localhost:8000/api';

export default function LogTimeMachine() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [evidenceModalEvent, setEvidenceModalEvent] = useState(null);
  const [showAllEvidenceModal, setShowAllEvidenceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch incidents list
  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/incidents`);
      if (res.ok) {
        const data = await res.json();
        const list = data.incidents || [];
        setIncidents(list);
        if (list.length > 0 && !selectedIncident) {
          setSelectedIncident(list[0]);
          setSelectedEvent(list[0].events[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // When incident selection changes
  const handleSelectIncident = (incId) => {
    const inc = incidents.find(i => i.id === incId);
    if (inc) {
      setSelectedIncident(inc);
      setCurrentStep(1);
      setSelectedEvent(inc.events[0]);
      setIsPlaying(false);
    }
  };

  // Playback timer effect
  useEffect(() => {
    let timer = null;
    if (isPlaying && selectedIncident) {
      const baseInterval = 1800; // 1.8s base
      const interval = baseInterval / playbackSpeed;
      
      timer = setInterval(() => {
        setCurrentStep((prevStep) => {
          if (prevStep < selectedIncident.events.length) {
            const nextStep = prevStep + 1;
            setSelectedEvent(selectedIncident.events[nextStep - 1]);
            return nextStep;
          } else {
            setIsPlaying(false);
            return prevStep;
          }
        });
      }, interval);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, selectedIncident, playbackSpeed]);

  const handlePlayPause = () => {
    if (!selectedIncident) return;
    if (currentStep >= selectedIncident.events.length) {
      setCurrentStep(1);
      setSelectedEvent(selectedIncident.events[0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStep(1);
    if (selectedIncident && selectedIncident.events.length > 0) {
      setSelectedEvent(selectedIncident.events[0]);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setSelectedEvent(selectedIncident.events[prev - 1]);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (selectedIncident && currentStep < selectedIncident.events.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setSelectedEvent(selectedIncident.events[next - 1]);
    }
  };

  const handleStepClick = (stepNum) => {
    setIsPlaying(false);
    setCurrentStep(stepNum);
    if (selectedIncident) {
      setSelectedEvent(selectedIncident.events[stepNum - 1]);
    }
  };

  if (isLoading && !selectedIncident) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <Activity className="animate-spin" size={32} color="#00f0ff" style={{ margin: '0 auto 1rem' }} />
        <div>Loading Log Time Machine Replay Engine...</div>
      </div>
    );
  }

  const eventsToDisplay = selectedIncident?.events || [];
  const activeEvent = selectedEvent || eventsToDisplay[currentStep - 1] || eventsToDisplay[0];
  const totalEvents = eventsToDisplay.length;
  const isComplete = currentStep === totalEvents;

  // Chart data calculation
  const chartData = eventsToDisplay.slice(0, currentStep).map((evt) => ({
    time: evt.display_time,
    risk: evt.risk_score_at_step,
    step: evt.step_number,
    type: evt.event_type
  }));

  const getSeverityBadgeStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fdba74' };
      case 'MEDIUM':
        return { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', text: '#fde047' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#93c5fd' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header & Compact Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, #090e1a 0%, #0d1527 100%)',
        border: '1px solid #1b263b',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Clock color="#00f0ff" size={24} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', margin: 0 }} className="mono">
                LOG TIME MACHINE
              </h1>
              <span style={{
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '0.375rem',
                letterSpacing: '0.05em'
              }}>
                INCIDENT REPLAY ENGINE
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.35rem 0 0 2rem' }}>
              Replay and investigate chronologically how an anomaly evolved into a full security breach.
            </p>
          </div>

          {/* Incident Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }} className="mono">
              INCIDENT SESSION:
            </label>
            <select
              value={selectedIncident?.id || ''}
              onChange={(e) => handleSelectIncident(e.target.value)}
              style={{
                background: '#040914',
                border: '1px solid #00f0ff',
                color: '#00f0ff',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
              }}
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id}: {inc.title} {inc.is_demo ? '(Demo Data)' : '(Live DB)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Incident Summary Metadata Bar */}
        {selectedIncident && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: 'rgba(4, 9, 20, 0.7)',
            border: '1px solid #1e293b',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }} className="mono">INCIDENT ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }} className="mono">
                {selectedIncident.id}
                {selectedIncident.is_demo && (
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginLeft: '0.4rem', fontWeight: 600 }}>(Demo)</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }} className="mono">TIMEFRAME</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                {selectedIncident.start_time.split("T")[1]?.replace("Z", "")} → {selectedIncident.end_time.split("T")[1]?.replace("Z", "")}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }} className="mono">CORRELATED EVENTS</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                {selectedIncident.event_count} Events
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }} className="mono">RISK LEVEL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: selectedIncident.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316',
                  background: selectedIncident.risk_level === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${selectedIncident.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316'}`
                }}>
                  {selectedIncident.risk_level} ({selectedIncident.risk_score}%)
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }} className="mono">AFFECTED ENTITY</div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }} className="truncate">
                {selectedIncident.affected_entity}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Playback Control Bar */}
      <div style={{
        background: '#090e1a',
        border: '1px solid #1b263b',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Main Play / Controls buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={handlePlayPause}
              style={{
                background: isPlaying
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                color: '#040914',
                border: 'none',
                padding: '0.6rem 1.35rem',
                borderRadius: '0.375rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: isPlaying ? '0 0 16px rgba(245, 158, 11, 0.4)' : '0 0 16px rgba(0, 240, 255, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {isPlaying ? <Pause size={18} fill="#040914" /> : <Play size={18} fill="#040914" />}
              <span>{isPlaying ? 'PAUSE' : '▶ PLAY INCIDENT'}</span>
            </button>

            <button
              onClick={handleRestart}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '0.6rem 0.85rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Restart from beginning"
            >
              <RotateCcw size={15} />
              <span>Restart</span>
            </button>

            <div style={{ display: 'flex', gap: '0.25rem', borderLeft: '1px solid #1e293b', paddingLeft: '0.65rem' }}>
              <button
                onClick={handlePrev}
                disabled={currentStep <= 1}
                style={{
                  background: '#040914',
                  color: currentStep <= 1 ? '#475569' : '#00f0ff',
                  border: '1px solid #1e293b',
                  padding: '0.55rem',
                  borderRadius: '0.375rem',
                  cursor: currentStep <= 1 ? 'not-allowed' : 'pointer'
                }}
                title="Previous Event"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={handleNext}
                disabled={currentStep >= totalEvents}
                style={{
                  background: '#040914',
                  color: currentStep >= totalEvents ? '#475569' : '#00f0ff',
                  border: '1px solid #1e293b',
                  padding: '0.55rem',
                  borderRadius: '0.375rem',
                  cursor: currentStep >= totalEvents ? 'not-allowed' : 'pointer'
                }}
                title="Next Event"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }} className="mono">PLAYBACK SPEED:</span>
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                style={{
                  background: playbackSpeed === spd ? 'rgba(0, 240, 255, 0.2)' : '#040914',
                  color: playbackSpeed === spd ? '#00f0ff' : '#64748b',
                  border: playbackSpeed === spd ? '1px solid #00f0ff' : '1px solid #1e293b',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Step Progress Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }} className="mono">
              Event <span style={{ color: '#00f0ff' }}>{currentStep}</span> of <span style={{ color: '#94a3b8' }}>{totalEvents}</span>
            </span>
            {isComplete && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid #10b981',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}>
                REPLAY COMPLETE
              </span>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div style={{ width: '100%', height: '6px', background: '#040914', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{
            height: '100%',
            width: `${(currentStep / totalEvents) * 100}%`,
            background: 'linear-gradient(90deg, #00f0ff 0%, #3b82f6 50%, #ef4444 100%)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)'
          }} />
        </div>
      </div>

      {/* 3. Interactive Horizontal Timeline & Event Cards */}
      <div style={{
        background: '#090e1a',
        border: '1px solid #1b263b',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#00f0ff" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
              CHRONOLOGICAL INCIDENT TIMELINE
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Click any event step to inspect detailed normalized fields & raw log
          </span>
        </div>

        {/* Horizontal Event Node Stepper */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          scrollbarWidth: 'thin'
        }}>
          {eventsToDisplay.map((evt) => {
            const isRevealed = evt.step_number <= currentStep;
            const isSelected = evt.step_number === currentStep;
            const sevStyle = getSeverityBadgeStyle(evt.severity);

            return (
              <div
                key={evt.id}
                onClick={() => handleStepClick(evt.step_number)}
                style={{
                  minWidth: '170px',
                  maxWidth: '190px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : (isRevealed ? '#0d1527' : '#040711'),
                  border: isSelected
                    ? '2px solid #00f0ff'
                    : (isRevealed ? '1px solid #1e293b' : '1px dashed #151d2a'),
                  opacity: isRevealed ? 1 : 0.45,
                  borderRadius: '0.5rem',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 240, 255, 0.3)' : 'none',
                  flexShrink: 0,
                  position: 'relative'
                }}
              >
                {/* Step indicator header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: isSelected ? '#00f0ff' : '#64748b'
                  }} className="mono">
                    STEP {evt.step_number}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: sevStyle.bg,
                    border: `1px solid ${sevStyle.border}`,
                    color: sevStyle.text,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px'
                  }}>
                    {evt.severity}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }} className="mono">
                  {evt.display_time}
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  lineHeight: '1.25',
                  marginBottom: '0.5rem',
                  height: '2.4em',
                  overflow: 'hidden'
                }}>
                  {evt.event_type}
                </div>

                <div style={{ fontSize: '0.7rem', color: '#64748b' }} className="truncate">
                  {evt.user !== 'N/A' ? `User: ${evt.user}` : `IP: ${evt.source_ip}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Event Detail Panel & Traceability */}
      {activeEvent && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Left: Normalized Fields & Details */}
          <div style={{
            background: '#090e1a',
            border: '1px solid #1b263b',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} color="#00f0ff" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
                  EVENT DETAIL (STEP {activeEvent.step_number})
                </h3>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: activeEvent.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}>
                {activeEvent.severity} SEVERITY
              </span>
            </div>

            {/* Why this event is considered relevant */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.85rem'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.25rem' }} className="mono">
                WHY THIS EVENT IS RELEVANT:
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fef3c7', lineHeight: '1.4' }}>
                {activeEvent.relevance_reason}
              </div>
            </div>

            {/* Normalized Attribute Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#040914', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }} className="mono">EVENT TYPE</div>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>{activeEvent.event_type}</div>
              </div>
              <div style={{ background: '#040914', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }} className="mono">TIMESTAMP</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }} className="mono">{activeEvent.timestamp}</div>
              </div>
              <div style={{ background: '#040914', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }} className="mono">SOURCE IP</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }} className="mono">{activeEvent.source_ip}</div>
              </div>
              <div style={{ background: '#040914', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }} className="mono">TARGET USER / HOST</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{activeEvent.user} @ {activeEvent.hostname}</div>
              </div>
            </div>

            {/* Traceability button */}
            <button
              onClick={() => setEvidenceModalEvent(activeEvent)}
              className="btn-cyber-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.65rem' }}
            >
              <FileCheck size={16} />
              <span>VIEW ORIGINAL EVIDENCE (1:1 RAW LOG)</span>
            </button>
          </div>

          {/* Right: Raw Log & Trace Link Box */}
          <div style={{
            background: '#090e1a',
            border: '1px solid #1b263b',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
                1:1 EVIDENCE TRACEABILITY
              </h3>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              ASTERIA traces normalized findings directly back to their originating raw log payload without synthetic loss.
            </div>

            <div style={{ background: '#040914', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#00f0ff', fontWeight: 700 }} className="mono">
                  NORMALIZED EVENT ID: {activeEvent.id}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700 }} className="mono">
                  RAW LOG ID: {activeEvent.raw_event_id}
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '0.35rem' }} className="mono">
                ORIGINAL RAW LOG MESSAGE:
              </div>

              <pre style={{
                background: '#02050b',
                color: '#34d399',
                border: '1px solid #0f172a',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0
              }}>
                {activeEvent.raw_log}
              </pre>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={14} color="#00f0ff" />
              <span>Parser: <strong style={{ color: '#cbd5e1' }}>{activeEvent.parser_used}</strong></span>
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <span>ML Anomaly Score: <strong style={{ color: '#ef4444' }}>{activeEvent.ml_anomaly_score}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Risk Evolution Chart */}
      <div style={{
        background: '#090e1a',
        border: '1px solid #1b263b',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#ef4444" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
              RISK EVOLUTION TRAJECTORY
            </h3>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem'
          }} className="mono">
            RISK TRAJECTORY: {selectedIncident?.risk_trajectory || 'RAPIDLY INCREASING'}
          </div>
        </div>

        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#090e1a', borderColor: '#1b263b', color: '#f8fafc' }}
                labelStyle={{ color: '#00f0ff' }}
                formatter={(val) => [`${val}%`, 'Risk Score']}
              />
              <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#riskGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Incident Correlation Chain ("Why Were These Events Connected?") */}
      <div style={{
        background: '#090e1a',
        border: '1px solid #1b263b',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
            WHY WERE THESE EVENTS CONNECTED? (CORRELATION CHAIN)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedIncident?.correlation_rules?.map((rule, idx) => (
            <div
              key={idx}
              style={{
                background: '#040914',
                border: '1px solid #1e293b',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.85rem'
              }}
            >
              <span style={{
                background: 'rgba(0, 240, 255, 0.1)',
                color: '#00f0ff',
                fontWeight: 800,
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.72rem'
              }} className="mono">
                LINK #{idx + 1}
              </span>
              <div style={{ color: '#cbd5e1', fontWeight: 600, flex: 1 }}>
                {rule.relation}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }} className="mono">
                Step {rule.from_step} → Step {rule.to_step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. "What Changed?" Baseline Comparison Panel */}
      {selectedIncident?.baseline_vs_during && (
        <div style={{
          background: '#090e1a',
          border: '1px solid #1b263b',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#34d399" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }} className="mono">
              WHAT CHANGED? (BASELINE VS INCIDENT STATE)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Before Baseline */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 800, marginBottom: '0.75rem' }} className="mono">
                BEFORE (NORMAL BASELINE)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                {Object.entries(selectedIncident.baseline_vs_during.before).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(15, 23, 42, 0.6)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>{k.replace(/_/g, ' ')}:</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* During Incident */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 800, marginBottom: '0.75rem' }} className="mono">
                DURING INCIDENT (ANOMALOUS PATTERN)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#f8fafc' }}>
                {Object.entries(selectedIncident.baseline_vs_during.during).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#fca5a5' }}>{k.replace(/_/g, ' ')}:</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Final Reconstruction Summary Card (if complete or requested) */}
      {(isComplete || showAllEvidenceModal) && (
        <div style={{
          background: 'linear-gradient(135deg, #090e1a 0%, #150a1d 100%)',
          border: '2px solid #a855f7',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 0 24px rgba(168, 85, 247, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 color="#a855f7" size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }} className="mono">
                INCIDENT RECONSTRUCTION COMPLETE
              </h3>
            </div>
            <button
              onClick={() => setShowAllEvidenceModal(true)}
              className="btn-cyber-primary"
              style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', border: 'none' }}
            >
              <Eye size={16} />
              <span>[VIEW ALL EVIDENCE]</span>
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#e2e8f0', margin: 0, lineHeight: '1.5' }}>
            <strong>Pattern Identified:</strong> {selectedIncident?.summary}
          </p>

          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            <strong>Key Contributing Factors:</strong>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
              {selectedIncident?.key_contributing_factors?.map((f, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Single Evidence Modal */}
      {evidenceModalEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid #00f0ff',
            borderRadius: '0.75rem',
            maxWidth: '700px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 0 32px rgba(0, 240, 255, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck color="#00f0ff" size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }} className="mono">
                  ORIGINAL EVIDENCE (STEP {evidenceModalEvent.step_number})
                </h3>
              </div>
              <button
                onClick={() => setEvidenceModalEvent(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Step 1: Normalized Event */}
              <div style={{ background: '#040914', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#00f0ff', fontWeight: 700, marginBottom: '0.35rem' }} className="mono">
                  1. NORMALIZED FINDING
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                  <strong>Type:</strong> {evidenceModalEvent.event_type} | <strong>Severity:</strong> {evidenceModalEvent.severity}
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#64748b' }}>↓</div>

              {/* Step 2: Processing info */}
              <div style={{ background: '#040914', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.35rem' }} className="mono">
                  2. PROCESSING INFORMATION
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Parser Plugin: {evidenceModalEvent.parser_used} | Anomaly Score: {evidenceModalEvent.ml_anomaly_score}
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#64748b' }}>↓</div>

              {/* Step 3: Raw Log */}
              <div style={{ background: '#040914', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, marginBottom: '0.35rem' }} className="mono">
                  3. ORIGINAL RAW LOG ENTRY (ID: {evidenceModalEvent.raw_event_id})
                </div>
                <pre style={{
                  background: '#02050b',
                  color: '#34d399',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0
                }}>
                  {evidenceModalEvent.raw_log}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Evidence Modal */}
      {showAllEvidenceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid #a855f7',
            borderRadius: '0.75rem',
            maxWidth: '900px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 0 32px rgba(168, 85, 247, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database color="#a855f7" size={22} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }} className="mono">
                  ALL CORRELATED EVIDENCE (RAW LOG TRACE LIST)
                </h3>
              </div>
              <button
                onClick={() => setShowAllEvidenceModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {eventsToDisplay.map((evt) => (
                <div key={evt.id} style={{ background: '#040914', border: '1px solid #1e293b', borderRadius: '0.375rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a855f7', marginBottom: '0.35rem' }} className="mono">
                    <span>STEP #{evt.step_number} • {evt.event_type}</span>
                    <span>RAW ID: {evt.raw_event_id}</span>
                  </div>
                  <pre style={{
                    background: '#02050b',
                    color: '#34d399',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    margin: 0
                  }}>
                    {evt.raw_log}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
