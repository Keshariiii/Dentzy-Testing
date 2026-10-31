'use client';
import React, { Component } from 'react';

export class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[DashboardErrorBoundary caught]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: '#f4f6f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e0ebe5', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '8px' }}>Admin Dashboard Reload</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              A technical error occurred while loading this view.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: '#1e5038', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Reload Dashboard
              </button>
              <a
                href="/login?role=admin"
                style={{ background: '#eef6f2', color: '#1e5038', border: '1px solid #c5ddd3', borderRadius: '8px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default DashboardErrorBoundary;
