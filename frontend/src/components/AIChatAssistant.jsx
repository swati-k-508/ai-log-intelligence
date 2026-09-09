import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Search, 
  Trash2, 
  Download, 
  ArrowRight, 
  ExternalLink, 
  Cpu, 
  Database,
  Terminal,
  Clock,
  User,
  Shield,
  HelpCircle,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function AIChatAssistant({ onSelectLogAndInspect, activeThreatCount = 0 }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `### 🤖 Welcome to Asteria AI Log Copilot\n\nI am your **Air-Gapped Security & Log Intelligence Assistant**. You can ask me anything about ingested perimeter logs, anomalous threat activity, specific IP addresses, user access patterns, or pipeline compression telemetry.\n\n**Quick things you can ask:**\n* *"Investigate suspicious activity from IP 192.168.1.105"*\n* *"Explain the root privilege escalation attack on 10.0.4.22"*\n* *"What is our current pipeline deduplication rate?"*\n* *"Show all failed SSH authentications and brute force attempts"*\n* *"List all critical security threat flags"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matching_logs: [],
      related_alerts: [],
      suggested_followups: [
        "Investigate suspicious IP 192.168.1.105",
        "Summarize all detected security threat alerts",
        "What is the current pipeline deduplication rate?",
        "Show all failed SSH authentication attempts"
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Investigate suspicious IP 192.168.1.105",
    "Summarize all detected security threat alerts",
    "What is the current pipeline deduplication rate?",
    "Show all failed SSH authentication attempts"
  ]);

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Fetch dynamic suggestions on mount
    fetch(`${API_BASE}/chat/suggestions`)
      .then(res => res.json())
      .then(data => {
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matching_logs: data.matching_logs || [],
        related_alerts: data.related_alerts || [],
        suggested_followups: data.suggested_followups || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **AI Intelligence Error:** Failed to retrieve response from the backend analysis engine (${err.message}). Please ensure the backend server is running on port 8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matching_logs: [],
        related_alerts: [],
        suggested_followups: ["What is the pipeline deduplication rate?", "Show latest alerts"]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'reset-msg',
        sender: 'ai',
        text: "🧹 Conversation history cleared. Ask me anything about log activity, forensic traces, or security threats.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matching_logs: [],
        related_alerts: [],
        suggested_followups: suggestions
      }
    ]);
  };

  const exportChat = () => {
    const transcript = messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Asteria_AI_Log_Analysis_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Basic markdown parser for clean chat formatting
  const renderMarkdown = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let tableLines = [];
    let inTable = false;

    const flushTable = (keyPrefix) => {
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
        const rowCols = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

        elements.push(
          <div key={`table-${keyPrefix}`} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', background: '#090d13', border: '1px solid #21262d', borderRadius: '4px' }}>
              <thead>
                <tr style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                  {headerCols.map((h, i) => (
                    <th key={i} style={{ padding: '0.45rem 0.65rem', textAlign: 'left', color: '#8b949e', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowCols.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #21262d' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '0.4rem 0.65rem', color: '#c9d1d9' }} dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableLines = [];
      inTable = false;
    };

    const formatInline = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f0f6fc;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color: #8b949e;">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #21262d; color: #58a6ff; padding: 0.1rem 0.35rem; border-radius: 3px; font-family: monospace; font-size: 0.74rem;">$1</code>');
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableLines.push(line.trim());
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      if (line.startsWith('### ')) {
        elements.push(<h3 key={idx} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#58a6ff', margin: '0.75rem 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }} dangerouslySetInnerHTML={{ __html: formatInline(line.replace('### ', '')) }} />);
      } else if (line.startsWith('#### ')) {
        elements.push(<h4 key={idx} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f6fc', margin: '0.6rem 0 0.3rem 0' }} dangerouslySetInnerHTML={{ __html: formatInline(line.replace('#### ', '')) }} />);
      } else if (line.startsWith('* ') || line.startsWith('- ')) {
        elements.push(
          <div key={idx} style={{ display: 'flex', gap: '0.4rem', margin: '0.2rem 0', fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.45 }}>
            <span style={{ color: '#58a6ff' }}>•</span>
            <div dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          elements.push(
            <div key={idx} style={{ display: 'flex', gap: '0.4rem', margin: '0.25rem 0', fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.45 }}>
              <span style={{ color: '#58a6ff', fontWeight: 600 }} className="mono">{numMatch[1]}.</span>
              <div dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
            </div>
          );
        }
      } else if (line.trim() === '') {
        elements.push(<div key={idx} style={{ height: '0.35rem' }} />);
      } else {
        elements.push(
          <p key={idx} style={{ fontSize: '0.81rem', color: '#c9d1d9', margin: '0.25rem 0', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      }
    });

    if (inTable) {
      flushTable('end');
    }

    return elements;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '0.75rem' }}>
      
      {/* Top Telemetry & Control Banner */}
      <div className="eng-card" style={{ padding: '0.65rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Asteria AI Security & Log Assistant
              <span style={{ fontSize: '0.65rem', background: '#21262d', color: '#34d399', border: '1px solid #30363d', padding: '0.1rem 0.4rem', borderRadius: '3px' }} className="mono">
                ● 100% AIR-GAPPED NLP
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#8b949e' }}>
              Zero-latency contextual SIEM triage, forensic correlation & plain-language explanations
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={exportChat} 
            className="btn-eng-secondary" 
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Download conversation transcript as .txt"
          >
            <Download size={13} /> Export Report
          </button>
          <button 
            onClick={clearChat} 
            className="btn-eng-secondary" 
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444' }}
            title="Clear current chat messages"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sug)}
            disabled={isLoading}
            className="eng-tag"
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              color: '#58a6ff',
              padding: '0.3rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={11} color="#f59e0b" /> {sug}
          </button>
        ))}
      </div>

      {/* Chat Conversation Scroll Area */}
      <div ref={chatScrollRef} className="eng-card" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              {/* Message Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', padding: '0 0.2rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isUser ? '#58a6ff' : '#a855f7' }}>
                  {isUser ? 'ANALYST' : 'ASTERIA COPILOT'}
                </span>
                <span style={{ fontSize: '0.64rem', color: '#6e7681' }} className="mono">
                  {msg.timestamp}
                </span>
              </div>

              {/* Message Bubble */}
              <div 
                style={{
                  maxWidth: isUser ? '75%' : '85%',
                  background: isUser ? '#1f6feb' : '#161b22',
                  color: '#f0f6fc',
                  border: isUser ? '1px solid #388bfd' : '1px solid #30363d',
                  borderRadius: isUser ? '8px 8px 1px 8px' : '8px 8px 8px 1px',
                  padding: '0.75rem 1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {renderMarkdown(msg.text)}

                {/* Embedded Interactive Matching Logs */}
                {msg.matching_logs && msg.matching_logs.length > 0 && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #21262d' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f0f6fc', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Database size={13} color="#3b82f6" /> Matching Canonical Events ({msg.matching_logs.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {msg.matching_logs.map((log) => (
                        <div 
                          key={log.id} 
                          style={{
                            background: '#090d13',
                            border: '1px solid #21262d',
                            borderRadius: '4px',
                            padding: '0.45rem 0.6rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.73rem'
                          }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{
                              padding: '0.05rem 0.35rem',
                              borderRadius: '2px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              background: log.severity === 'CRITICAL' ? '#ef444422' : (log.severity === 'HIGH' ? '#f59e0b22' : '#3b82f622'),
                              color: log.severity === 'CRITICAL' ? '#ef4444' : (log.severity === 'HIGH' ? '#f59e0b' : '#3b82f6'),
                              border: `1px solid ${log.severity === 'CRITICAL' ? '#ef444444' : (log.severity === 'HIGH' ? '#f59e0b44' : '#3b82f644')}`
                            }}>
                              {log.severity}
                            </span>
                            <span style={{ fontWeight: 600, color: '#f0f6fc' }} className="mono">{log.event_type}</span>
                            {log.source_ip && <span style={{ color: '#8b949e' }}>src: <span style={{ color: '#58a6ff' }}>{log.source_ip}</span></span>}
                            {log.user && <span style={{ color: '#8b949e' }}>user: <span style={{ color: '#f0f6fc' }}>{log.user}</span></span>}
                            {log.dup_count > 1 && <span style={{ color: '#a855f7', fontWeight: 600 }}>x{log.dup_count}</span>}
                          </div>

                          <button 
                            onClick={() => onSelectLogAndInspect(log)}
                            className="btn-eng-secondary"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                            title="Inspect 1:1 Raw Source Trace"
                          >
                            <ExternalLink size={11} /> Trace
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Chips */}
                {msg.suggested_followups && msg.suggested_followups.length > 0 && !isUser && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #21262d' }}>
                    <div style={{ fontSize: '0.68rem', color: '#8b949e', marginBottom: '0.35rem', fontWeight: 600 }}>
                      SUGGESTED NEXT QUERIES:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {msg.suggested_followups.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendMessage(f)}
                          className="eng-tag"
                          style={{
                            background: '#21262d',
                            border: '1px solid #30363d',
                            color: '#58a6ff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.69rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ArrowRight size={10} /> {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing / Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', padding: '0 0.2rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#a855f7' }}>ASTERIA COPILOT</span>
              <span style={{ fontSize: '0.64rem', color: '#6e7681' }}>processing log index...</span>
            </div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={14} className="spin" color="#58a6ff" />
              <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>Correlating event signatures & threat vectors...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box & Action Strip */}
      <div className="eng-card" style={{ padding: '0.65rem 0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about any IP (e.g. 192.168.1.105), user, attack type, or pipeline metric..."
            style={{
              flex: 1,
              background: '#090d13',
              border: '1px solid #30363d',
              borderRadius: '4px',
              padding: '0.6rem 0.85rem',
              color: '#f0f6fc',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            className="btn-eng-primary"
            style={{ padding: '0.6rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Send size={14} /> Send
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.68rem', color: '#6e7681' }}>
          <span>Press <kbd style={{ background: '#21262d', padding: '0.1rem 0.3rem', borderRadius: '2px', border: '1px solid #30363d' }}>Enter</kbd> to submit query</span>
          <span>Asteria Local NLP Index • Query latency ~15ms</span>
        </div>
      </div>

    </div>
  );
}
