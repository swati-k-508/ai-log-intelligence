import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ASTERIA UI Component Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="cyber-card" style={{ padding: '2rem', margin: '1rem 0', color: '#fb7185', background: '#090e1a', border: '1px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={24} color="#f43f5e" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              ASTERIA Component Render Exception
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            {this.state.error?.toString() || "A component failed to render cleanly."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="btn-cyber-primary"
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} /> Retry Component Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
