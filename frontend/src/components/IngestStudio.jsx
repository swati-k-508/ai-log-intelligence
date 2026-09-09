import React, { useState } from 'react';
import { UploadCloud, Play, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IngestStudio({ onIngestText, onIngestFile, onIngestSeed, isIngesting }) {
  const [rawTextInput, setRawTextInput] = useState('');
  const [sourceName, setSourceName] = useState('perimeter_gateway_01');
  const [statusMsg, setStatusMsg] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(null);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!rawTextInput.trim()) return;
    setStatusMsg(null);
    const res = await onIngestText(rawTextInput, sourceName);
    if (res?.status === 'success') {
      const summary = res.summary || {};
      const elapsed = summary.elapsed_seconds ? ` in ${summary.elapsed_seconds}s` : '';
      const throughput = summary.throughput_eps ? ` (${summary.throughput_eps.toLocaleString()} logs/sec)` : '';
      setStatusMsg({ 
        type: 'success', 
        text: `Ingested ${summary.received?.toLocaleString() || 0} raw events${elapsed}${throughput}: ${summary.parsed?.toLocaleString() || 0} parsed, ${summary.deduplicated?.toLocaleString() || 0} deduplicated, ${summary.new_alerts_triggered || 0} threat alerts.` 
      });
      setRawTextInput('');
    } else {
      setStatusMsg({ type: 'error', text: res?.error || 'Failed to ingest raw log stream.' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatusMsg(null);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgress(`Uploading and processing ${file.name} (${sizeMb} MB)...`);
    
    try {
      const res = await onIngestFile(file);
      if (res?.status === 'success') {
        const summary = res.summary || {};
        const elapsed = summary.elapsed_seconds ? ` in ${summary.elapsed_seconds}s` : '';
        const throughput = summary.throughput_eps ? ` (${summary.throughput_eps.toLocaleString()} logs/sec)` : '';
        setStatusMsg({ 
          type: 'success', 
          text: `Processed ${file.name} (${sizeMb} MB)${elapsed}${throughput}: ${summary.received?.toLocaleString() || 0} received, ${summary.parsed?.toLocaleString() || 0} normalized, ${summary.deduplicated?.toLocaleString() || 0} deduplicated, ${summary.new_alerts_triggered || 0} threat alerts.` 
        });
      } else {
        setStatusMsg({ 
          type: 'error', 
          text: res?.error || `Failed to process uploaded file ${file.name}.` 
        });
      }
    } finally {
      setUploadProgress(null);
      e.target.value = ''; // reset file input
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
          Heterogeneous Log Ingestion Console
        </div>
        <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
          Feed raw logs from perimeter network devices (Firewalls, SSH, VPNs, Routers, Auth Servers) via file upload, paste, or synthetic seed.
        </p>
      </div>

      {uploadProgress && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '3px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#7dd3fc',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(125, 211, 252, 0.3)', borderTopColor: '#7dd3fc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          {uploadProgress}
        </div>
      )}

      {statusMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: '3px',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
          color: statusMsg.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.8rem',
          fontWeight: 500
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} color="#34d399" /> : <AlertCircle size={16} color="#ef4444" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        
        {/* Left Column: Direct Text Paste Ingest */}
        <div className="eng-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.2rem' }}>
            Paste Raw Log Stream (Live Feed)
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.75rem' }}>
            Multi-line raw text in any format (Syslog, JSON Lines, KV Pipe, Bracketed).
          </p>

          <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
                Perimeter Source Device Name / Identifier:
              </label>
              <input
                type="text"
                className="eng-input"
                placeholder="e.g. edge-router-01, fortinet-firewall, vpn-node"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                style={{ fontSize: '0.75rem' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
                Raw Log Payload (Plain Text):
              </label>
              <textarea
                className="eng-input"
                placeholder="Paste raw log lines here...&#10;Aug 22 10:14:22 edge-fw01 kernel: [DENY] IN=eth0 OUT= SRC=192.168.1.105 DST=10.0.0.1 PROTO=TCP SPT=49152 DPT=22"
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                rows={10}
                style={{ flex: 1, resize: 'vertical', fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', minHeight: '140px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <button
                type="submit"
                disabled={isIngesting || !rawTextInput.trim()}
                className="btn-eng-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}
              >
                <Send size={13} /> {isIngesting ? "Processing Pipeline..." : "Process Log Batch"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: File Upload & Demo Dataset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* File Upload Box */}
          <div className="eng-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc' }}>
              Bulk Log File Ingestion
            </div>
            <p style={{ fontSize: '0.7rem', color: '#8b949e' }}>
              Upload authentic log dump files (<span className="mono">.log, .txt, .csv, .json</span>) up to 50MB. Processed in stream buffers with continuous progress indicator.
            </p>

            <label style={{
              border: '1px dashed #30363d',
              borderRadius: '3px',
              padding: '1.75rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#090d13',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}>
              <UploadCloud size={24} color="#3b82f6" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f0f6fc' }}>
                Select or Drop Log Dump File
              </span>
              <span style={{ fontSize: '0.68rem', color: '#8b949e' }}>
                Auto-detects UTF-8 / ASCII heterogeneous event lines
              </span>
              <input 
                type="file" 
                onChange={handleFileUpload}
                disabled={isIngesting}
                style={{ display: 'none' }} 
                accept=".log,.txt,.csv,.json"
              />
            </label>
          </div>

          {/* Preset Demo Stream */}
          <div className="eng-card-highlight" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc' }}>
              Preset Demonstration Scenario: Nexora Technologies
            </div>
            <p style={{ fontSize: '0.7rem', color: '#8b949e', lineHeight: 1.4 }}>
              Instantly seed the calibrated test dataset containing 1,000+ multi-format perimeter events:
            </p>
            <ul style={{ fontSize: '0.7rem', color: '#8b949e', paddingLeft: '1rem', margin: '0 0 0.4rem 0', lineHeight: 1.45 }}>
              <li>SSH Password Brute Force sequence (<span className="mono" style={{ color: '#ef4444' }}>192.168.1.105</span>)</li>
              <li>Root Privilege Escalation intrusion (<span className="mono" style={{ color: '#ef4444' }}>10.0.4.22</span>)</li>
              <li>Perimeter Firewall SYN Port Scan (<span className="mono" style={{ color: '#f59e0b' }}>172.16.0.88</span>)</li>
              <li>90–95% chatter volume reduction via 60s sliding window deduplication</li>
            </ul>

            <button
              onClick={onIngestSeed}
              disabled={isIngesting}
              className="btn-eng-secondary"
              style={{ padding: '0.45rem', justifyContent: 'center', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#f0f6fc' }}
            >
              <Play size={13} color="#3b82f6" /> {isIngesting ? "Ingesting Stream..." : "Inject Nexora Attack Stream"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
