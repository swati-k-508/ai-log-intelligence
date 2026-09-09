import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Globe, Terminal, Cpu, Database, Box, Layers, Cloud, 
  Shield, Network, Zap, Lock, Activity, GitBranch, ShieldAlert, 
  Layout, Code, Play, Pause, Eye, ArrowLeft, ArrowRight,
  CheckCircle, Copy, Trash2, Sliders, Terminal as TerminalIcon, AlertTriangle, Flame
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const ICON_MAP = {
  Server, Globe, Terminal, Cpu, Database, Box, Layers, Cloud, 
  Shield, Network, Zap, Lock, Activity, GitBranch, ShieldAlert, 
  Layout, Code
};

const API_BASE = 'http://localhost:8000/api';

const SYSTEM_SCENARIOS_MAP = {
  apache: [
    { id: "normal", name: "Routine HTTP Traffic", type: "normal", desc: "Standard GET/POST 200 OK access" },
    { id: "sqli", name: "SQL Injection Probe", type: "attack", desc: "' UNION SELECT username,password FROM users" },
    { id: "traversal", name: "Directory Traversal", type: "attack", desc: "Access attempt for /etc/passwd" },
    { id: "ddos", name: "HTTP Flood / Spike", type: "stress", desc: "Rapid burst of 500 error requests" }
  ],
  nginx: [
    { id: "normal", name: "Normal Proxy Pass", type: "normal", desc: "Upstream proxy 200 responses" },
    { id: "upstream_timeout", name: "504 Gateway Timeout", type: "stress", desc: "Upstream backend microservice unreachable" },
    { id: "rate_limit", name: "Rate Limit Exceeded", type: "warning", desc: "Client IP exceeded request zone limit" },
    { id: "buffer_overflow", name: "Large Body Exploit", type: "attack", desc: "Client intended to send too large body" }
  ],
  linux: [
    { id: "normal", name: "Routine Syslog Activity", type: "normal", desc: "Systemd services & accepted logins" },
    { id: "brute_force", name: "SSH Password Brute Force", type: "attack", desc: "Repeated Failed password for root" },
    { id: "priv_esc", name: "Root Privilege Escalation", type: "attack", desc: "sudo su - executed by sysadmin" },
    { id: "oom", name: "Kernel OOM Killer", type: "warning", desc: "Out of memory killing process java" }
  ],
  windows: [
    { id: "normal", name: "Kerberos User Logon", type: "normal", desc: "Event ID 4624 successful logon" },
    { id: "auth_failure", name: "Event 4625 Bad Password", type: "attack", desc: "Account logon failure / password spray" },
    { id: "admin_priv", name: "Event 4672 Special Privileges", type: "warning", desc: "Administrator rights assigned to session" }
  ],
  mysql: [
    { id: "normal", name: "Normal DB Query Execution", type: "normal", desc: "SELECT query on product tables" },
    { id: "auth_denied", name: "Access Denied (Bad Password)", type: "attack", desc: "Access denied for user root@192.168.1.105" },
    { id: "slow_query", name: "Slow Query Lock (>5s)", type: "stress", desc: "Query lock on order transactions table" }
  ],
  postgres: [
    { id: "normal", name: "Transaction Commit", type: "normal", desc: "Normal PostgreSQL statement execution" },
    { id: "exfil", name: "Massive Data Exfiltration", type: "attack", desc: "SELECT * FROM credit_cards LIMIT 1000000" },
    { id: "deadlock", name: "Deadlock Detected", type: "stress", desc: "Transaction aborted due to lock contention" }
  ],
  mongodb: [
    { id: "normal", name: "Document Read / Write", type: "normal", desc: "BSON document query completed in 4ms" },
    { id: "auth_fail", name: "SCRAM Auth Failure", type: "attack", desc: "Authentication failure on admin db" },
    { id: "slow_op", name: "Slow Aggregation Pipeline", type: "stress", desc: "Aggregation duration 480ms without index" }
  ],
  docker: [
    { id: "normal", name: "Container Healthy", type: "normal", desc: "Container started and healthcheck passed" },
    { id: "oom", name: "Container OOMKilled", type: "warning", desc: "Out of memory in web-worker container" },
    { id: "port_conflict", name: "Port Binding Failure", type: "stress", desc: "Failed to bind port 8080: address in use" }
  ],
  kubernetes: [
    { id: "normal", name: "Pod Scheduled", type: "normal", desc: "Pod successfully scheduled on worker-node-03" },
    { id: "crash_loop", name: "CrashLoopBackOff", type: "stress", desc: "Container in pod auth-service continuously failing" },
    { id: "rbac_violation", name: "Unauthorized Kube-API Call", type: "attack", desc: "Forbidden GET /api/v1/secrets for serviceaccount" }
  ],
  aws_cloudtrail: [
    { id: "normal", name: "Console Login (MFA OK)", type: "normal", desc: "ConsoleLogin with MFA authentication" },
    { id: "unauth_iam", name: "Unauthorized Policy Attach", type: "attack", desc: "AttachRolePolicy AdministratorAccess denied" },
    { id: "open_sg", name: "Open 0.0.0.0/0 Security Group", type: "warning", desc: "AuthorizeSecurityGroupIngress port 22 open" }
  ],
  firewall: [
    { id: "normal", name: "Traffic ALLOW", type: "normal", desc: "Outbound HTTPS permit rule triggered" },
    { id: "port_scan", name: "Reconnaissance Port Scan", type: "attack", desc: "SYN sweep against ports 22, 80, 443, 3389" },
    { id: "c2_deny", name: "C2 Botnet IP Drop", type: "attack", desc: "Perimeter DENY for malicious IP 198.51.100.4" }
  ],
  network: [
    { id: "normal", name: "Interface Up / BGP Converged", type: "normal", desc: "GigabitEthernet0/1 link UP status" },
    { id: "port_sec", name: "Port Security MAC Violation", type: "attack", desc: "Unauthorized MAC address blocked on port 4" },
    { id: "bgp_flap", name: "BGP Route Flap", type: "stress", desc: "BGP peer 10.254.0.1 changed state to Down" }
  ],
  api_gateway: [
    { id: "normal", name: "API Request 200 OK", type: "normal", desc: "POST /api/v1/payments returned in 24ms" },
    { id: "cred_stuff", name: "Credential Stuffing (429)", type: "attack", desc: "Rate limit exceeded on /api/v1/auth/login" },
    { id: "unauth_api", name: "Unauthorized Endpoint (401)", type: "attack", desc: "GET /api/v1/admin/keys without token" }
  ],
  auth_service: [
    { id: "normal", name: "Keycloak SSO Login", type: "normal", desc: "JWT token issued for user sysadmin" },
    { id: "mfa_fail", name: "MFA Challenge Failed", type: "attack", desc: "Invalid TOTP passcode 5 consecutive times" },
    { id: "token_forgery", name: "Forged JWT Signature", type: "attack", desc: "Token verification failed: invalid signature" }
  ],
  app_server: [
    { id: "normal", name: "Spring Service Trace", type: "normal", desc: "OrderService processed transaction successfully" },
    { id: "latency_spike", name: "Latency Threshold Exceeded", type: "stress", desc: "PaymentGateway latency > 3500ms" },
    { id: "null_pointer", name: "Unhandled NullPointerException", type: "warning", desc: "Null pointer in UserService.authenticate" }
  ],
  dns_server: [
    { id: "normal", name: "Standard DNS A Query", type: "normal", desc: "Query for api.nexora.com resolved to 10.0.0.1" },
    { id: "dns_tunnel", name: "C2 DNS Tunneling Exfiltration", type: "attack", desc: "Query for data.exfil.a98f12.botnet.org IN TXT" },
    { id: "nxdomain", name: "DGA NXDOMAIN Storm", type: "stress", desc: "Burst of non-existent random domain queries" }
  ],
  load_balancer: [
    { id: "normal", name: "ALB Target Health 200 OK", type: "normal", desc: "Round-robin traffic forward to 10.0.1.25" },
    { id: "502_bad_gw", name: "502 Bad Gateway Burst", type: "stress", desc: "All target instances failing healthcheck" },
    { id: "slow_client", name: "Slowloris Incomplete Request", type: "attack", desc: "Client socket timeout before HTTP header complete" }
  ],
  security_events: [
    { id: "normal", name: "Routine Process Execution", type: "normal", desc: "explorer.exe spawned notepad.exe (PID 4920)" },
    { id: "mimikatz", name: "LSASS Memory Dump Attempt", type: "attack", desc: "Mimikatz tool attempted to read lsass.exe" },
    { id: "powershell_enc", name: "Obfuscated PowerShell Execution", type: "attack", desc: "powershell.exe -EncodedCommand SQBFAFgA..." }
  ],
  web_app: [
    { id: "normal", name: "User Session Active", type: "normal", desc: "Session active for user_1024" },
    { id: "csrf_fail", name: "CSRF Token Validation Failed", type: "attack", desc: "Origin header mismatch in state-changing POST" },
    { id: "xss_probe", name: "Stored XSS Payload Blocked", type: "attack", desc: "Sanitized <script>alert(document.cookie)</script>" }
  ],
  custom_app: [
    { id: "normal", name: "Banking Tx Completed", type: "normal", desc: "Core banking debit transaction verified" },
    { id: "limit_bypass", name: "Withdrawal Limit Bypass Attempt", type: "attack", desc: "EVENT=LimitBypassAttempt | AMOUNT=5000000" },
    { id: "sync_fail", name: "Ledger Replication Sync Error", type: "stress", desc: "Distributed transaction ledger out of sync" }
  ]
};

// Custom Minimalist Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#090d13', border: '1px solid #30363d', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}>
        <p style={{ color: '#f0f6fc', fontWeight: 600, marginBottom: '0.25rem' }} className="mono">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', color: entry.color }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 700 }} className="mono">{entry.value} ev/s</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Chronological sliding window baseline generator
const generateChronologicalBaseline = (sysId) => {
  const now = new Date();
  const points = [];
  const count = 7;
  
  const baseRate = 
    sysId === 'firewall' || sysId === 'apache' || sysId === 'nginx' || sysId === 'load_balancer' ? 180 :
    sysId === 'kubernetes' || sysId === 'docker' || sysId === 'api_gateway' || sysId === 'aws_cloudtrail' ? 140 :
    sysId === 'linux' || sysId === 'windows' || sysId === 'dns_server' || sysId === 'mysql' ? 110 : 80;

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const tot = baseRate + (i * 4);
    const normal = Math.round(tot * 0.90);
    const anomaly = Math.max(0, tot - normal);
    points.push({ time: timeStr, total: tot, normal, anomaly });
  }
  return points;
};

export default function SystemCommandCenter({
  system,
  sources = [],
  onSelectSystem,
  onNavigateTab,
  onSelectLogAndInspect,
  onBackToLanding
}) {
  const [activeSystem, setActiveSystem] = useState(system || sources[0] || { id: 'apache', name: 'Apache HTTP Server', category: 'Web Server', icon: 'Server', format: 'Syslog / Common Log Format' });
  const [isStreaming, setIsStreaming] = useState(true);
  const [rawStream, setRawStream] = useState([]);
  const [latestNormLog, setLatestNormLog] = useState(null);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeScenario, setActiveScenario] = useState('normal');
  const [isInjecting, setIsInjecting] = useState(false);

  // Dynamic Live Session Counters
  const [liveRawCount, setLiveRawCount] = useState(0);
  const [liveParsedCount, setLiveParsedCount] = useState(0);
  const [liveDedupCount, setLiveDedupCount] = useState(0);
  const [liveThreatCount, setLiveThreatCount] = useState(0);

  const [chartData, setChartData] = useState(() => generateChronologicalBaseline(activeSystem?.id || 'apache'));

  const terminalContainerRef = useRef(null);
  const streamIntervalRef = useRef(null);

  // Sync activeSystem when prop changes
  useEffect(() => {
    if (system && system.id !== activeSystem.id) {
      handleSwitchSystem(system);
    }
  }, [system]);

  const handleSwitchSystem = (src) => {
    setActiveSystem(src);
    setRawStream([]);
    setLatestNormLog(null);
    setActiveScenario('normal');
    setChartData(generateChronologicalBaseline(src.id));
    if (onSelectSystem) onSelectSystem(src);
  };

  // Fetch initial system stats & timeseries from database
  const fetchSystemData = async (sysId) => {
    try {
      const [statsRes, tsRes] = await Promise.all([
        fetch(`${API_BASE}/generators/system/${sysId}/stats`),
        fetch(`${API_BASE}/generators/system/${sysId}/timeseries`)
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
        
        // Sync live counters from backend base
        setLiveRawCount(prev => Math.max(prev, data.telemetry?.total_raw_ingested || 0));
        setLiveParsedCount(prev => Math.max(prev, data.telemetry?.canonical_stored || 0));
        setLiveDedupCount(prev => Math.max(prev, data.telemetry?.deduplicated_count || 0));
        
        const rawAlertsCount = data.alerts?.length || 0;
        const initialThreats = rawAlertsCount > 0 ? rawAlertsCount : (data.telemetry?.threat_level === 'CRITICAL' ? 3 : (data.telemetry?.threat_level === 'ELEVATED' ? 1 : 0));
        setLiveThreatCount(prev => Math.max(prev, initialThreats));

        if (data.recent_logs && data.recent_logs.length > 0 && !latestNormLog) {
          setLatestNormLog(data.recent_logs[0]);
        }
      }
      if (tsRes.ok) {
        const tsData = await tsRes.json();
        if (tsData.timeseries && tsData.timeseries.length > 0) {
          setChartData(tsData.timeseries);
        }
      }
    } catch (err) {
      console.error("System stats error:", err);
    }
  };

  useEffect(() => {
    if (activeSystem?.id) {
      fetchSystemData(activeSystem.id);
      triggerSystemLog(activeSystem.id, 1, 'normal');
    }
  }, [activeSystem?.id]);

  // Auto-scroll inside terminal container only (zero whole-page scroll jump)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [rawStream]);

  // Live streaming loop: triggers authentic backend log generation and ingestion
  useEffect(() => {
    if (!isStreaming || !activeSystem?.id) {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      return;
    }

    streamIntervalRef.current = setInterval(() => {
      triggerSystemLog(activeSystem.id, 1, activeScenario);
    }, 1800);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isStreaming, activeSystem?.id, activeScenario]);

  const triggerSystemLog = async (sourceId, count = 1, scenario = null) => {
    try {
      const targetScenario = scenario || activeScenario || 'normal';
      const res = await fetch(`${API_BASE}/generators/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, count, scenario: targetScenario })
      });
      if (res.ok) {
        const data = await res.json();
        
        // 1. Append verbatim raw log lines
        if (data.raw_logs && data.raw_logs.length > 0) {
          const newEntries = data.raw_logs.map(line => ({
            id: Math.random().toString(36).substr(2, 9),
            text: line,
            timestamp: new Date().toLocaleTimeString()
          }));
          setRawStream(prev => [...prev.slice(-50), ...newEntries]);
        }

        // 2. Immediate 1:1 Normalization Trace Sync
        let normLog = null;
        if (data.normalized_logs && data.normalized_logs.length > 0) {
          normLog = data.normalized_logs[0];
          setLatestNormLog(normLog);
        }

        // 3. Increment Dynamic Live Telemetry Counters
        const numReceived = data.summary?.received || count;
        const numParsed = data.summary?.parsed || count;
        const numDedup = data.summary?.deduplicated || 0;
        const isThreatEvent = normLog && (normLog.severity === 'CRITICAL' || normLog.severity === 'HIGH' || normLog.category === 'SECURITY');
        const numThreats = (data.summary?.new_alerts_triggered || 0) + (isThreatEvent ? 1 : 0);

        setLiveRawCount(prev => prev + numReceived);
        setLiveParsedCount(prev => prev + numParsed);
        setLiveDedupCount(prev => prev + numDedup);
        if (numThreats > 0) {
          setLiveThreatCount(prev => prev + numThreats);
        }

        // 4. Update Recent Logs in Table
        if (normLog) {
          setStats(prev => {
            if (!prev) return prev;
            const currentList = prev.recent_logs || [];
            return {
              ...prev,
              recent_logs: [normLog, ...currentList.filter(l => l.id !== normLog.id)].slice(0, 30)
            };
          });
        }

        // 5. Real-Time Chart Update (Strict Chronological Sliding Window)
        const isThreat = isThreatEvent;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        setChartData(prev => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const inc = normLog?.dup_count || 1;
          if (lastIdx >= 0 && copy[lastIdx].time === timeStr) {
            copy[lastIdx] = {
              ...copy[lastIdx],
              total: copy[lastIdx].total + inc,
              normal: copy[lastIdx].normal + (isThreat ? 0 : inc),
              anomaly: copy[lastIdx].anomaly + (isThreat ? inc : 0)
            };
            return copy;
          } else {
            return [...copy.slice(1), {
              time: timeStr,
              total: inc,
              normal: isThreat ? 0 : inc,
              anomaly: isThreat ? inc : 0
            }];
          }
        });
      }
    } catch (err) {
      console.error("Trigger log error:", err);
    }
  };

  const handleTriggerScenario = async (scId) => {
    setActiveScenario(scId);
    setIsInjecting(true);
    await triggerSystemLog(activeSystem.id, 1, scId);
    setTimeout(() => setIsInjecting(false), 500);
  };

  const handleCopyLogs = () => {
    const allText = rawStream.map(r => r.text).join('\n');
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const IconComp = ICON_MAP[activeSystem.icon] || Server;

  // Real-time computed metrics with graceful fallbacks
  const displayRaw = liveRawCount > 0 ? liveRawCount : (stats?.telemetry?.total_raw_ingested || rawStream.length + 120);
  const displayParsed = liveParsedCount > 0 ? liveParsedCount : (stats?.telemetry?.canonical_stored || rawStream.length + 115);
  const displayDedup = liveDedupCount;
  const dedupPercent = displayRaw > 0 ? Math.min(99.9, ((displayDedup / Math.max(1, displayRaw + displayDedup)) * 100)).toFixed(1) : "0.0";
  const displayStored = displayParsed;
  const displayThreats = liveThreatCount;

  const currentScenarios = SYSTEM_SCENARIOS_MAP[activeSystem.id] || [
    { id: "normal", name: "Routine Activity", type: "normal", desc: "Standard system telemetry" },
    { id: "attack", name: "Security Attack Probe", type: "attack", desc: "Malicious signature test" }
  ];

  const filteredHistory = (stats?.recent_logs || []).filter(l => {
    if (filterSeverity && l.severity !== filterSeverity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchIp = l.source_ip?.toLowerCase().includes(term);
      const matchType = l.event_type?.toLowerCase().includes(term);
      const matchUser = l.user?.toLowerCase().includes(term);
      if (!matchIp && !matchType && !matchUser) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '3rem' }}>
      
      {/* 1. Top Navigation & Quick System Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        
        {/* Navigation Bar */}
        <div className="eng-card" style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(22, 32, 38, 0.95)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onBackToLanding}
              className="btn-cyber-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
            >
              <ArrowLeft size={14} /> Back to 20 Systems
            </button>
            <div style={{ height: '18px', width: '1px', background: '#3b4956' }} />
            <div style={{ fontSize: '0.8rem', color: '#B8CDD5', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconComp size={16} color="#D8E8C8" />
              <span>Live System Command Center:</span>
              <strong style={{ color: '#D8E8C8' }}>{activeSystem.name}</strong>
              <span className={`badge-fmt ${activeSystem.badge_class || 'badge-syslog'}`} style={{ fontSize: '0.65rem', marginLeft: '0.4rem' }}>
                {activeSystem.format ? activeSystem.format.split('/')[0] : 'Syslog'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('overview')}
              className="btn-cyber-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
            >
              Global SOC Command <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('beforeafter')}
              className="btn-cyber-primary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <Eye size={13} /> 1:1 Inspector
            </button>
          </div>
        </div>

        {/* Horizontal System Switcher Carousel */}
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.3rem', scrollbarWidth: 'thin' }}>
          {sources.map(src => {
            const SrcIcon = ICON_MAP[src.icon] || Server;
            const isCurr = src.id === activeSystem.id;
            return (
              <button
                key={src.id}
                onClick={() => handleSwitchSystem(src)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.38rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.73rem',
                  fontWeight: isCurr ? 700 : 500,
                  color: isCurr ? '#D8E8C8' : '#B8CDD5',
                  background: isCurr ? 'rgba(168, 193, 176, 0.22)' : 'rgba(22, 32, 38, 0.7)',
                  border: isCurr ? '1.5px solid #A8C1B0' : '1px solid #2d3843',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <SrcIcon size={13} color={isCurr ? '#D8E8C8' : '#7F9F7C'} />
                <span>{src.name}</span>
                {isCurr && <span className="live-dot" />}
              </button>
            );
          })}
        </div>

        {/* Interactive Scenario & Attack Trigger Strip */}
        <div className="eng-card" style={{ padding: '0.55rem 0.85rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', background: '#111820', border: '1px solid #23303c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sliders size={13} color="#D8E8C8" /> Live Scenarios:
            </span>
            {currentScenarios.map(sc => {
              const isSelected = activeScenario === sc.id;
              const isAttack = sc.type === 'attack';
              const isWarning = sc.type === 'warning' || sc.type === 'stress';
              return (
                <button
                  key={sc.id}
                  onClick={() => handleTriggerScenario(sc.id)}
                  title={sc.desc}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isSelected 
                      ? (isAttack ? '#dc2626' : (isWarning ? '#d97706' : '#238636'))
                      : (isAttack ? 'rgba(239, 68, 68, 0.12)' : (isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(22, 32, 38, 0.8)')),
                    color: isSelected ? '#ffffff' : (isAttack ? '#f87171' : (isWarning ? '#fbbf24' : '#B8CDD5')),
                    border: isSelected ? '1px solid transparent' : (isAttack ? '1px solid #7f1d1d' : (isWarning ? '1px solid #78350f' : '1px solid #30363d'))
                  }}
                >
                  {isAttack && <Flame size={12} />}
                  {isWarning && <AlertTriangle size={12} />}
                  <span>{sc.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.7rem', color: '#7F9F7C' }}>
            {isInjecting ? "⚡ Ingesting scenario event into pipeline..." : "Click any scenario to inject live traffic or attack vectors."}
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS DATA ROW (DYNAMIC REAL-TIME COUNTERS) */}
      <div className="eng-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', background: '#161b22', border: '1px solid #30363d' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>RAW INGESTED</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#ffffff' }} className="mono">
              {displayRaw.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>PARSED & NORMALIZED</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#38bdf8' }} className="mono">
              {displayParsed.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>DEDUPLICATED</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#3b82f6' }} className="mono">
              {displayDedup.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8b949e' }}>({dedupPercent}% reduced)</span>
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>STORED EVENTS</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: '#4ade80' }} className="mono">
              {displayStored.toLocaleString()}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>SECURITY THREATS</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 700, color: displayThreats > 0 ? '#ef4444' : '#6e7681' }} className="mono">
              {displayThreats} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: displayThreats > 0 ? '#ef4444' : '#8b949e' }}>flags</span>
            </span>
          </div>
        </div>

        {/* START / PAUSE LIVE STREAM BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            style={{ 
              fontSize: '0.82rem', 
              padding: '0.45rem 1.1rem',
              background: isStreaming ? '#21262d' : '#238636',
              border: isStreaming ? '1px solid #30363d' : '1px solid #2ea043',
              color: '#ffffff',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isStreaming ? <Pause size={15} /> : <Play size={15} />}
            {isStreaming ? "Pause Live Stream" : "Start Live Stream"}
          </button>
        </div>
      </div>

      {/* 3. LIVE GRAPH: INGESTION THROUGHPUT & ANOMALY VELOCITY (CHRONOLOGICAL REAL-TIME LINE CHART) */}
      <div className="eng-card" style={{ padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', background: '#161b22', border: '1px solid #30363d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Ingestion Throughput & Anomaly Velocity (ev/s) — {activeSystem.name}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
              Real event ingestion throughput vs. ML anomaly flags in chronological time sequence
            </span>
          </div>
          <span className="badge-tag" style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d', fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
            Live Sliding Window
          </span>
        </div>

        <div style={{ width: '100%', height: 230 }}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#21262d" vertical={false} />
              <XAxis dataKey="time" stroke="#6e7681" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
              <YAxis stroke="#6e7681" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '6px', fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="normal" name="Routine Traffic" stroke="#6e7681" strokeWidth={1.3} dot={false} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="anomaly" name="Threat Spikes" stroke="#ef4444" strokeWidth={2} dot={{ r: 3.5, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="total" name="Total Ingest" stroke="#3b82f6" strokeWidth={1.8} dot={{ r: 2.5, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. DUAL-PANE REAL-TIME CONSOLE: Raw Telemetry Stream vs. Canonical Transformation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
        
        {/* Left Pane: Real-time Terminal Window */}
        <div className="eng-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', height: '400px', background: '#0a1014', border: '1px solid #2d3843' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid #1f2933', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TerminalIcon size={16} color="#D8E8C8" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                Verbatim Raw Log Stream ({rawStream.length} buffered)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={handleCopyLogs}
                className="btn-cyber-secondary"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                title="Copy all raw log lines"
              >
                <Copy size={12} /> {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setRawStream([])}
                className="btn-cyber-secondary"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                title="Clear terminal window"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>

          <div ref={terminalContainerRef} style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.6, padding: '0.4rem' }}>
            {rawStream.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6e7681' }}>
                <Activity size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div>Waiting for incoming stream packets from {activeSystem.name}...</div>
                <div style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>Auto-streaming is active.</div>
              </div>
            ) : (
              rawStream.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    marginBottom: '0.45rem', 
                    padding: '0.25rem 0.4rem', 
                    borderRadius: '4px',
                    color: '#D8E8C8',
                    wordBreak: 'break-all'
                  }}
                >
                  <span style={{ color: '#7F9F7C', marginRight: '0.5rem' }}>[{item.timestamp}]</span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: ULPF Canonical Transformation & Extracted Fields */}
        <div className="eng-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', height: '400px', background: '#141d24', border: '1px solid #3b4956' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid #2d3843', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} color="#A8C1B0" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D8E8C8' }}>
                ULPF Canonical Normalization (1:1 Trace)
              </span>
            </div>

            {latestNormLog && (
              <button
                onClick={() => onSelectLogAndInspect && onSelectLogAndInspect(latestNormLog.id)}
                className="btn-cyber-primary"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
              >
                Inspect 1:1 <ArrowRight size={11} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.78rem' }}>
            {latestNormLog ? (
              <div>
                {/* Canonical Schema Header Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', background: '#0d151a', padding: '0.65rem', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>Event Type:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.82rem' }}>{latestNormLog.event_type}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>Severity:</span>
                    <div>
                      <span className={`badge-sev badge-sev-${(latestNormLog.severity || 'low').toLowerCase()}`}>
                        {latestNormLog.severity}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>Source IP:</span>
                    <div className="mono" style={{ color: '#D8E8C8', fontWeight: 600 }}>{latestNormLog.source_ip || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>User / Account:</span>
                    <div className="mono" style={{ color: '#ffffff' }}>{latestNormLog.user || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>Format Parsed:</span>
                    <div style={{ color: '#A8C1B0' }}>{latestNormLog.format_detected}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#B8CDD5', textTransform: 'uppercase' }}>Deduplication:</span>
                    <div style={{ color: '#7F9F7C', fontWeight: 700 }}>x{latestNormLog.dup_count || 1} count</div>
                  </div>
                </div>

                {/* Extracted Metadata Fields JSON */}
                <div style={{ background: '#0a1014', border: '1px solid #2d3843', borderRadius: '6px', padding: '0.65rem' }}>
                  <div style={{ color: '#7F9F7C', fontWeight: 700, fontSize: '0.72rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Extracted Metadata (JSON):</span>
                    <span className="mono" style={{ fontSize: '0.65rem', color: '#B8CDD5' }}>UUID: {latestNormLog.raw_event_id ? latestNormLog.raw_event_id.substr(0, 8) : 'sync'}...</span>
                  </div>
                  <pre style={{ margin: 0, color: '#C8D8CF', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', maxHeight: '160px' }}>
                    {JSON.stringify(latestNormLog.extracted_fields || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6e7681' }}>
                No canonical events processed yet for this session.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. SYSTEM LOG HISTORY & SEARCH TABLE */}
      <div className="eng-card" style={{ padding: '1rem', background: '#161b22', border: '1px solid #30363d' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              Recent Canonical Logs: {activeSystem.name} ({filteredHistory.length} records)
            </div>
            <span style={{ fontSize: '0.72rem', color: '#B8CDD5' }}>
              Click any row to view full 1:1 raw bi-directional trace in the inspector.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className="eng-input"
              placeholder="Search IP, user, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '180px', fontSize: '0.74rem' }}
            />

            <select
              className="eng-input"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ width: 'auto', fontSize: '0.74rem' }}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
          <table className="eng-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Canonical Event Type</th>
                <th>Source IP</th>
                <th>User</th>
                <th>Action</th>
                <th>Format</th>
                <th>Dedupe</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6e7681' }}>
                    No matching logs found for {activeSystem.name}. Logs will populate automatically as stream runs.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((l) => (
                  <tr 
                    key={l.id} 
                    onClick={() => onSelectLogAndInspect && onSelectLogAndInspect(l.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono" style={{ fontSize: '0.72rem', color: '#7F9F7C' }}>{l.timestamp}</td>
                    <td>
                      <span className={`badge-sev badge-sev-${(l.severity || 'low').toLowerCase()}`}>
                        {l.severity}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{l.event_type}</td>
                    <td className="mono" style={{ color: '#D8E8C8' }}>{l.source_ip || '-'}</td>
                    <td className="mono" style={{ color: '#C8D8CF' }}>{l.user || '-'}</td>
                    <td><span className="badge-tag">{l.action}</span></td>
                    <td><span className="badge-fmt badge-syslog" style={{ fontSize: '0.65rem' }}>{l.format_detected}</span></td>
                    <td className="mono" style={{ color: '#7F9F7C', fontWeight: 700 }}>x{l.dup_count || 1}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectLogAndInspect) onSelectLogAndInspect(l.id);
                        }}
                        className="btn-cyber-secondary"
                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
