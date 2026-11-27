'use client';

import React, { Component } from 'react';
import PortalStatusPage, {
  statusBtnPrimaryStyle,
  statusBtnSecondaryStyle,
} from './PortalStatusPage';

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
        <PortalStatusPage
          backHref="/login?role=admin"
          backLabel="Back to Admin Login"
          portalBadge="Admin Portal"
          eyebrow="Admin Portal · View Recovery"
          title="Unable to load Admin Dashboard"
          paragraphs={[
            'A technical error occurred while rendering this view. Your lab records and accounts have not been affected.',
            'Reload the dashboard to recover, or sign in again with your executive credentials.',
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={statusBtnPrimaryStyle}
              >
                Reload Dashboard
              </button>
              <a href="/login?role=admin" style={statusBtnSecondaryStyle}>
                Admin Login
              </a>
            </>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
