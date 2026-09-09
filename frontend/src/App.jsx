import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import OverviewDashboard from './components/OverviewDashboard';
import IngestStudio from './components/IngestStudio';
import LogExplorer from './components/LogExplorer';
import BeforeAfterInspector from './components/BeforeAfterInspector';
import PipelineMonitor from './components/PipelineMonitor';
import SecurityAlerts from './components/SecurityAlerts';
import PlugAndPlayStudio from './components/PlugAndPlayStudio';
import AnalyticsView from './components/AnalyticsView';
import LiveLogSourcesLanding from './components/LiveLogSourcesLanding';
import SystemCommandCenter from './components/SystemCommandCenter';
import AIChatAssistant from './components/AIChatAssistant';
import LogTimeMachine from './components/LogTimeMachine';
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = 'http://localhost:8000/api';

const DEFAULT_SOURCES = [
  { id: "apache", name: "Apache HTTP Server", category: "Web Server", icon: "Server", format: "Syslog / Common Log Format", badge_class: "badge-syslog", volume: "High volume", logs_generated: 1245, status: "STREAMING", description: "NCSA HTTP Access and Web Server traffic logs" },
  { id: "nginx", name: "Nginx Web Server", category: "Web Server", icon: "Globe", format: "Nginx Error / Access", badge_class: "badge-syslog", volume: "High volume", logs_generated: 980, status: "LIVE", description: "Nginx edge proxy and upstream server error events" },
  { id: "linux", name: "Linux System (SSHD)", category: "Operating System", icon: "Terminal", format: "RFC 3164 Syslog", badge_class: "badge-syslog", volume: "Continuous", logs_generated: 1540, status: "LIVE", description: "Linux kernel, systemd, and OpenSSH auth events" },
  { id: "windows", name: "Windows Event Log", category: "Operating System", icon: "Cpu", format: "Key-Value / EventLog", badge_class: "badge-kv", volume: "Medium volume", logs_generated: 620, status: "LIVE", description: "Windows Security Event ID 4625 & System Audits" },
  { id: "mysql", name: "MySQL Database", category: "Database", icon: "Database", format: "MySQL Error Log", badge_class: "badge-bracketed", volume: "Medium volume", logs_generated: 840, status: "LIVE", description: "RDBMS connection authentication and slow queries" },
  { id: "postgres", name: "PostgreSQL DB", category: "Database", icon: "Database", format: "PostgreSQL CSV / Log", badge_class: "badge-bracketed", volume: "Medium volume", logs_generated: 710, status: "LIVE", description: "Postgres transaction logs, locks, and client connections" },
  { id: "mongodb", name: "MongoDB Enterprise", category: "NoSQL Database", icon: "Database", format: "JSON Lines", badge_class: "badge-json", volume: "Medium volume", logs_generated: 915, status: "LIVE", description: "Document DB command execution and cluster health" },
  { id: "docker", name: "Docker Daemon", category: "Container", icon: "Box", format: "Docker Stdout / Stderr", badge_class: "badge-syslog", volume: "High volume", logs_generated: 1120, status: "LIVE", description: "Container runtime logs, restarts, and OOM events" },
  { id: "kubernetes", name: "Kubernetes Cluster", category: "Orchestration", icon: "Layers", format: "JSON Audit / K8s Event", badge_class: "badge-json", volume: "Cluster Event", logs_generated: 890, status: "LIVE", description: "Kubelet, pod crashes, and RBAC control plane audits" },
  { id: "aws_cloudtrail", name: "AWS CloudTrail", category: "Cloud Infrastructure", icon: "Cloud", format: "JSON Lines", badge_class: "badge-json", volume: "High volume", logs_generated: 1340, status: "LIVE", description: "AWS API calls, IAM role usage, and STS tokens" },
  { id: "firewall", name: "Perimeter Firewall", category: "Network Security", icon: "Shield", format: "Key-Value Pipe", badge_class: "badge-kv", volume: "Very high volume", logs_generated: 2450, status: "STREAMING", description: "Enterprise Palo Alto / Fortinet DENY & ALLOW traffic logs" },
  { id: "network", name: "Network Devices", category: "Network Hardware", icon: "Network", format: "Cisco Syslog", badge_class: "badge-syslog", volume: "High frequency", logs_generated: 670, status: "LIVE", description: "Core switch link status, BGP flaps, and port security" },
  { id: "api_gateway", name: "API Gateway", category: "API Management", icon: "Zap", format: "JSON Lines", badge_class: "badge-json", volume: "Burst traffic", logs_generated: 1420, status: "LIVE", description: "Kong / Envoy ingress proxy request latency and status" },
  { id: "auth_service", name: "Authentication Service", category: "Identity & IAM", icon: "Lock", format: "JSON Lines", badge_class: "badge-json", volume: "Event-based", logs_generated: 580, status: "LIVE", description: "Keycloak / Auth0 MFA attempts, JWT validation & logins" },
  { id: "app_server", name: "Application Server", category: "Middleware", icon: "Activity", format: "Bracketed Java Log", badge_class: "badge-bracketed", volume: "Continuous", logs_generated: 930, status: "LIVE", description: "Spring Boot / Enterprise JVM application traces" },
  { id: "dns_server", name: "DNS Server", category: "Network Core", icon: "Globe", format: "BIND / Query Log", badge_class: "badge-syslog", volume: "High frequency", logs_generated: 1850, status: "LIVE", description: "Internal BIND 9 query logs and malicious domain flags" },
  { id: "load_balancer", name: "Load Balancer (ALB)", category: "Cloud Infrastructure", icon: "GitBranch", format: "AWS ALB Log", badge_class: "badge-syslog", volume: "High volume", logs_generated: 1670, status: "LIVE", description: "AWS Elastic Load Balancer HTTP/HTTPS target status" },
  { id: "security_events", name: "EDR Security Agent", category: "Endpoint Security", icon: "ShieldAlert", format: "Custom EDR Format", badge_class: "badge-custom", volume: "Event-based", logs_generated: 490, status: "LIVE", description: "CrowdStrike / Defender process injection & malware alerts" },
  { id: "web_app", name: "Web Application", category: "Application", icon: "Layout", format: "Bracketed Apache Log", badge_class: "badge-bracketed", volume: "Medium volume", logs_generated: 760, status: "LIVE", description: "Frontend session exceptions, CSRF flags & API calls" },
  { id: "custom_app", name: "Custom Enterprise App", category: "Custom Plugin", icon: "Code", format: "Custom Pipe Format", badge_class: "badge-custom", volume: "Medium volume", logs_generated: 510, status: "LIVE", description: "Custom legacy banking transaction logs parsed by ULPF regex" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [selectedSystem, setSelectedSystem] = useState(DEFAULT_SOURCES[0]);

  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [parsers, setParsers] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);


  const fetchAllData = async () => {
    try {
      const [mRes, lRes, aRes, pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/metrics/funnel`),
        fetch(`${API_BASE}/logs/normalized?limit=200`),
        fetch(`${API_BASE}/alerts`),
        fetch(`${API_BASE}/parsers`),
        fetch(`${API_BASE}/generators/sources`)
      ]);

      if (mRes.ok) setMetrics(await mRes.json());
      if (lRes.ok) {
        const lData = await lRes.json();
        setLogs(lData.logs || []);
        if (lData.logs && lData.logs.length > 0 && !selectedTrace) {
          fetchTraceLog(lData.logs[0].id);
        }
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAlerts(aData.alerts || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setParsers(pData.parsers || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSources(sData.sources || []);
      }
    } catch (err) {
      console.error("ASTERIA API fetch error:", err);
    }
  };

  const handleTriggerGenerator = async (sourceId, count = 1) => {
    try {
      const res = await fetch(`${API_BASE}/generators/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, count })
      });
      const data = await res.json();
      if (res.ok && data) {
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Trigger generator error:", err);
    }
    return null;
  };


  const fetchTraceLog = async (normalizedId) => {
    try {
      const res = await fetch(`${API_BASE}/logs/trace/${normalizedId}`);
      if (res.ok) {
        setSelectedTrace(await res.json());
      }
    } catch (err) {
      console.error("Error fetching trace:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleIngestSeed = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/ingest/seed?clear_existing=true`, { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
        setActiveTab('overview');
      }
    } catch (err) {
      console.error("Seed error:", err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestText = async (rawText, sourceName) => {
    setIsIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/ingest/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, source_name: sourceName })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        await fetchAllData();
        return data;
      } else {
        return { status: 'error', error: data?.detail || 'Failed to ingest log stream' };
      }
    } catch (err) {
      console.error("Text ingest error:", err);
      return { status: 'error', error: err.message || 'Network connection error' };
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestFile = async (file) => {
    setIsIngesting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/ingest/file`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        await fetchAllData();
        return data;
      } else {
        return { status: 'error', error: data?.detail || `Server returned error (${res.status})` };
      }
    } catch (err) {
      console.error("File ingest error:", err);
      return { status: 'error', error: err.message || 'Network connection timeout or server unreachable' };
    } finally {
      setIsIngesting(false);
    }
  };

  const handleAddParser = async (parserReq) => {
    try {
      const res = await fetch(`${API_BASE}/parsers/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parserReq)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Add parser error:", err);
    }
    return false;
  };

  const handleResetDb = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        setSelectedTrace(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectLogAndInspect = (logId) => {
    fetchTraceLog(logId);
    setActiveTab('beforeafter');
  };

  const handleExploreSystem = (sys) => {
    setSelectedSystem(sys);
    setActiveTab('system_center');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117' }}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedSystem={selectedSystem}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* Main Command Center Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopHeader 
          rawLogCount={metrics?.funnel?.raw_received || 0}
          onOpenAi={() => setActiveTab('assistant')}
        />

        <main style={{ flex: 1, padding: activeTab === 'landing' ? 0 : '1rem 1.25rem', maxWidth: activeTab === 'landing' ? '100%' : '1600px', width: '100%', margin: '0 auto' }}>
          <ErrorBoundary>
            {activeTab === 'landing' && (
              <LiveLogSourcesLanding 
                sources={sources}
                onTriggerGenerator={handleTriggerGenerator}
                onNavigateTab={setActiveTab}
                onExploreSystem={handleExploreSystem}
                onResetDb={handleResetDb}
                isResetting={isResetting}
              />
            )}

            {activeTab === 'system_center' && (
              <SystemCommandCenter 
                system={selectedSystem}
                sources={sources}
                onSelectSystem={setSelectedSystem}
                onNavigateTab={setActiveTab}
                onSelectLogAndInspect={handleSelectLogAndInspect}
                onBackToLanding={() => setActiveTab('landing')}
              />
            )}

            {activeTab === 'overview' && (
              <OverviewDashboard 
                metrics={metrics}
                logs={logs}
                alerts={alerts}
                onIngestSeed={handleIngestSeed}
                isIngesting={isIngesting}
                onSelectLog={handleSelectLogAndInspect}
              />
            )}

            {activeTab === 'assistant' && (
              <AIChatAssistant 
                onSelectLogAndInspect={handleSelectLogAndInspect}
                activeThreatCount={alerts.length}
              />
            )}

            {activeTab === 'timemachine' && (
              <LogTimeMachine />
            )}

            {activeTab === 'ingest' && (
              <IngestStudio 
                onIngestText={handleIngestText}
                onIngestFile={handleIngestFile}
                onIngestSeed={handleIngestSeed}
                isIngesting={isIngesting}
              />
            )}

            {activeTab === 'explorer' && (
              <LogExplorer 
                logs={logs}
                onSelectLog={handleSelectLogAndInspect}
              />
            )}

            {activeTab === 'beforeafter' && (
              <BeforeAfterInspector 
                logs={logs}
                onTraceLog={fetchTraceLog}
                selectedTrace={selectedTrace}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineMonitor 
                metrics={metrics}
              />
            )}

            {activeTab === 'alerts' && (
              <SecurityAlerts 
                alerts={alerts}
              />
            )}

            {activeTab === 'parsers' && (
              <PlugAndPlayStudio 
                parsers={parsers}
                onAddParser={handleAddParser}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView 
                metrics={metrics}
              />
            )}
          </ErrorBoundary>
        </main>

        <footer style={{ borderTop: '1px solid #30363d', padding: '0.6rem 1.25rem', textAlign: 'center', fontSize: '0.72rem', color: '#6e7681', background: '#161b22' }} className="mono">
          ASTERIA // Universal Log Pre-processing Framework • Team SIH-2024 • Build v1.4-final
        </footer>
      </div>
    </div>
  );
}
