import React, { useState } from 'react';
import { Sliders, Plus, CheckCircle2, Code, Play, Terminal, Zap } from 'lucide-react';

export default function PlugAndPlayStudio({ parsers, onAddParser }) {
  const [name, setName] = useState('PALO_ALTO_CSV');
  const [pattern, setPattern] = useState(
    '^(?P<timestamp>[\\d\\-T:\\.Z]+),(?P<src_ip>\\d+\\.\\d+\\.\\d+\\.\\d+),(?P<dst_ip>\\d+\\.\\d+\\.\\d+\\.\\d+),(?P<user>[\\w\\-]+),(?P<action>[A-Z]+)$'
  );
  const [description, setDescription] = useState('Palo Alto Networks Firewall CSV Export Format');
  const [testInput, setTestInput] = useState('2026-08-22T10:40:00Z,192.168.10.5,10.0.0.8,johndoe,DENY');
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleTestRun = () => {
    try {
      const regex = new RegExp(pattern);
      const match = regex.exec(testInput);
      if (match && match.groups) {
        setTestResult({
          status: 'SUCCESS',
          format: name,
          extracted_regex_groups: match.groups,
          canonical_schema_mapping: {
            timestamp: match.groups.timestamp,
            event_type: match.groups.action === 'DENY' ? 'CONNECTION_BLOCKED' : 'CONNECTION_ALLOWED',
            category: 'NETWORK',
            severity: match.groups.action === 'DENY' ? 'MEDIUM' : 'LOW',
            source_ip: match.groups.src_ip,
            destination_ip: match.groups.dst_ip,
            user: match.groups.user,
            action: match.groups.action
          }
        });
      } else {
        setTestResult({
          status: 'FAILED',
          error: 'Regex pattern did not match test input line.'
        });
      }
    } catch (err) {
      setTestResult({
        status: 'ERROR',
        error: err.message
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    const fieldMappings = {
      timestamp: "timestamp",
      src_ip: "src_ip",
      dst_ip: "dst_ip",
      user: "user",
      action: "action"
    };

    const success = await onAddParser({
      name,
      pattern,
      field_mappings: fieldMappings,
      description
    });

    setIsSubmitting(false);
    if (success) {
      setStatusMsg(`Parser registered successfully — no core pipeline changes required.`);
    } else {
      setStatusMsg(`Failed to add parser plugin '${name}'.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="cyber-card-glow" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={22} /> Plug-and-Play Source Format Onboarding Studio
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Onboard new vendor log schemas dynamically via config & regex rules without writing Python code or restarting the server.
          </p>
        </div>
        <span className="badge-fmt badge-json" style={{ padding: '0.3rem 0.6rem' }}>
          Plugin Studio Active
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Form: Register New Log Format */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="#00f0ff" /> Register New Log Format Plugin
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Format Identifier Name
              </label>
              <input
                type="text"
                className="cyber-input mono"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Regex Capture Group Pattern
              </label>
              <textarea
                className="cyber-input mono"
                rows={3}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Must use named capture groups like <code>(?P&lt;src_ip&gt;...)</code>
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                Format Description
              </label>
              <input
                type="text"
                className="cyber-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-cyber-primary" style={{ marginTop: '0.25rem' }}>
              <Plus size={16} /> {isSubmitting ? "Registering Plugin..." : "Register Log Format Plugin"}
            </button>

            {statusMsg && (
              <div style={{
                background: statusMsg.includes('successfully') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${statusMsg.includes('successfully') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: statusMsg.includes('successfully') ? '#34d399' : '#fb7185',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle2 size={16} /> {statusMsg}
              </div>
            )}
          </form>
        </div>

        {/* Live Test Simulator Box */}
        <div className="cyber-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={18} color="#34d399" /> Live Parser Regex Test Simulator
          </h3>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
              Test Raw Log Input Line
            </label>
            <input
              type="text"
              className="cyber-input mono"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
          </div>

          <button onClick={handleTestRun} className="btn-cyber-secondary" style={{ alignSelf: 'flex-start' }}>
            <Play size={14} color="#34d399" /> Run Regex Simulation
          </button>

          {/* Test Results Output */}
          <div style={{ flex: 1, background: '#050811', border: '1px solid #1b263b', borderRadius: '0.375rem', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Terminal size={14} /> Instant Parser Test Output:
            </div>
            {!testResult && (
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Click 'Run Regex Simulation' to verify parsing output.</p>
            )}
            {testResult && (
              <pre style={{ 
                color: testResult.status === 'SUCCESS' ? '#34d399' : '#fb7185', 
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }} className="mono">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Registered Active Plugins List */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
          Registered Active Parser Plugins ({parsers.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1b263b', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '0.45rem 0.6rem' }}>Format Name</th>
                <th style={{ padding: '0.45rem 0.6rem' }}>Regex Capture Pattern</th>
                <th style={{ padding: '0.45rem 0.6rem' }}>Description</th>
                <th style={{ padding: '0.45rem 0.6rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    No custom plugins registered yet. Use the form above to add a format live.
                  </td>
                </tr>
              )}
              {parsers.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #131b2e' }}>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#00f0ff', fontWeight: 700 }} className="mono">{p.name}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="mono">{p.pattern}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#e2e8f0' }}>{p.description || 'N/A'}</td>
                  <td style={{ padding: '0.45rem 0.6rem' }}><span className="badge-sev badge-sev-low">ACTIVE</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
