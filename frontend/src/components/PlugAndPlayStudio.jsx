import React, { useState } from 'react';
import { Sliders, Plus, CheckCircle2, Play, Terminal } from 'lucide-react';

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
          error: 'Regex pattern did not match test input string.'
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
      setStatusMsg(`Parser registered successfully in runtime database.`);
    } else {
      setStatusMsg(`Failed to add parser plugin '${name}'.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Header Banner */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc' }}>
          Plug-and-Play Source Format Onboarding Studio
        </div>
        <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: '0.15rem' }}>
          Onboard new vendor log schemas dynamically via config & regex rules without writing Python code or restarting the service.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        
        {/* Form: Register New Log Format */}
        <div className="eng-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.75rem' }}>
            Register New Log Format Plugin
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
                Format Identifier Name
              </label>
              <input
                type="text"
                className="eng-input mono"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
                Regex Capture Group Pattern
              </label>
              <textarea
                className="eng-input mono"
                rows={3}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                required
                style={{ resize: 'vertical', fontSize: '0.74rem' }}
              />
              <span style={{ fontSize: '0.68rem', color: '#6e7681', marginTop: '0.2rem', display: 'block' }}>
                Must use named capture groups like <code className="mono" style={{ color: '#3b82f6' }}>(?P&lt;src_ip&gt;...)</code>
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
                Format Description
              </label>
              <input
                type="text"
                className="eng-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-eng-primary" style={{ alignSelf: 'flex-start' }}>
              <Plus size={14} /> {isSubmitting ? "Registering..." : "Register Format Plugin"}
            </button>

            {statusMsg && (
              <div style={{
                background: statusMsg.includes('successfully') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${statusMsg.includes('successfully') ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: statusMsg.includes('successfully') ? '#86efac' : '#fca5a5',
                padding: '0.5rem 0.75rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <CheckCircle2 size={14} /> {statusMsg}
              </div>
            )}
          </form>
        </div>

        {/* Live Test Simulator Box */}
        <div className="eng-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc' }}>
            Live Parser Regex Simulator
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: '#8b949e', display: 'block', marginBottom: '0.2rem' }}>
              Test Raw Log Input String
            </label>
            <input
              type="text"
              className="eng-input mono"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              style={{ fontSize: '0.74rem' }}
            />
          </div>

          <button onClick={handleTestRun} className="btn-eng-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.75rem' }}>
            <Play size={12} /> Test Regex Match
          </button>

          {/* Test Results Output */}
          <div style={{ flex: 1, background: '#090d13', border: '1px solid #21262d', borderRadius: '3px', padding: '0.65rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6e7681', marginBottom: '0.3rem' }}>
              Parser Simulation Output:
            </div>
            {!testResult && (
              <p style={{ fontSize: '0.75rem', color: '#6e7681' }}>Click 'Test Regex Match' to evaluate regular expression extraction.</p>
            )}
            {testResult && (
              <pre className="mono" style={{ 
                color: testResult.status === 'SUCCESS' ? '#86efac' : '#fca5a5', 
                fontSize: '0.72rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Registered Active Plugins List */}
      <div className="eng-card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.5rem' }}>
          Registered Active Parser Plugins ({parsers.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="eng-table">
            <thead>
              <tr>
                <th>Format Name</th>
                <th>Regex Capture Pattern</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#6e7681' }}>
                    No custom plugins registered yet. Use the form above to add a format live.
                  </td>
                </tr>
              )}
              {parsers.map((p) => (
                <tr key={p.id}>
                  <td className="mono" style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.74rem' }}>{p.name}</td>
                  <td className="mono" style={{ color: '#8b949e', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{p.pattern}</td>
                  <td style={{ color: '#c9d1d9', fontSize: '0.74rem' }}>{p.description || 'N/A'}</td>
                  <td><span className="badge-sev badge-sev-low">ACTIVE</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
