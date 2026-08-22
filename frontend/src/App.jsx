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
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [parsers, setParsers] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchAllData = async () => {
    try {
      const [mRes, lRes, aRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/metrics/funnel`),
        fetch(`${API_BASE}/logs/normalized?limit=200`),
        fetch(`${API_BASE}/alerts`),
        fetch(`${API_BASE}/parsers`)
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
    } catch (err) {
      console.error("ASTERIA API fetch error:", err);
    }
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
      const res = await fetch(`${API_BASE}/ingest/seed`, { method: 'POST' });
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
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Text ingest error:", err);
    } finally {
      setIsIngesting(false);
    }
    return null;
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
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("File ingest error:", err);
    } finally {
      setIsIngesting(false);
    }
    return null;
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060911' }}>
      {/* Compact Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* Main Command Center Layout Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopHeader 
          rawLogCount={metrics?.funnel?.raw_received || 0}
        />

        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <ErrorBoundary>
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

        <footer style={{ borderTop: '1px solid #1b263b', padding: '0.85rem 1.5rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', background: '#090e1a' }}>
          ASTERIA Security Command Center • Universal Log Pre-processing Framework
        </footer>
      </div>
    </div>
  );
}
