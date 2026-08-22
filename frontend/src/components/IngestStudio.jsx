import React, { useState } from 'react';
import { UploadCloud, Play, FileText, Send, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function IngestStudio({ onIngestText, onIngestFile, onIngestSeed, isIngesting }) {
  const [rawTextInput, setRawTextInput] = useState('');
  const [sourceName, setSourceName] = useState('custom_perimeter_stream');
  const [statusMsg, setStatusMsg] = useState(null);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!rawTextInput.trim()) return;
    setStatusMsg(null);
    const res = await onIngestText(rawTextInput, sourceName);
    if (res?.status === 'success') {
      setStatusMsg({ type: 'success', text: `Ingested ${res.summary?.received} raw events successfully!` });
      setRawTextInput('');
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to ingest raw log stream.' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatusMsg(null);
    const res = await onIngestFile(file);
    if (res?.status === 'success') {
      setStatusMsg({ type: 'success', text: `Uploaded ${file.name}: processed ${res.summary?.received} raw events.` });
    } else {
      setStatusMsg({ type: 'error', text: `Failed to process uploaded file ${file.name}.` });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="cyber-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <UploadCloud size={22} color="#00f0ff" /> Heterogeneous Log Ingestion Studio
        </h2>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Feed raw logs from any perimeter network device (Firewalls, VPNs, SSH, Routers, IDS/IPS).
        </p>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '0.375rem',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: statusMsg.type === 'success' ? '#34d399' : '#fb7185',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMsg.text}
        </div>
      )}

      {/* Stream Nexora Synthetic Dataset Card */}
      <div className="cyber-card-glow" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <span className="badge-fmt badge-json" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>RECOMMENDED SIH DEMO DATASET</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Stream "Nexora Technologies" Multi-Format Dataset</h3>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.25rem', maxWidth: '680px' }}>
            Features ~80% normal traffic + 4 embedded attack scenarios (SSH Password Brute Force, Brute Force to Root Privilege Escalation, Network Port Scan, Unauthorized API Access) across 4 distinct raw log formats with malformed entries.
          </p>
        </div>
        <button onClick={onIngestSeed} disabled={isIngesting} className="btn-cyber-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
          <Play size={18} /> {isIngesting ? "Ingesting Dataset..." : "Stream Nexora Demo Dataset"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Upload File Card */}
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#60a5fa" /> Upload Log File (.log, .txt, .json)
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Drop any heterogeneous log file. Formats will be auto-detected per line.
          </p>

          <div style={{
            border: '2px dashed #1b263b',
            borderRadius: '0.375rem',
            padding: '2rem 1rem',
            textAlign: 'center',
            background: '#050811',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <UploadCloud size={36} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
            <span style={{ fontSize: '0.85rem', color: '#f8fafc', display: 'block', fontWeight: 600 }}>
              Click to select log file to process
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
              Accepts plain text, json, syslog streams up to 50MB
            </span>
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Paste Raw Log Text Area Card */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="#34d399" /> Paste Raw Log Lines
          </h3>

          <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Source Identifier Tag
              </label>
              <input
                type="text"
                className="cyber-input"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Raw Log Lines (One per line)
              </label>
              <textarea
                className="cyber-input mono"
                rows={6}
                placeholder={`Aug 22 10:31:04 host sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22\n2026-08-22T10:31:05Z | AUTH_FAILURE | user=admin | ip=192.168.1.100\n[10:31:08] LOGIN_FAIL user=admin ip=192.168.1.100`}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isIngesting || !rawTextInput.trim()} className="btn-cyber-primary" style={{ alignSelf: 'flex-start' }}>
              <Send size={16} /> Process Log Stream
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
