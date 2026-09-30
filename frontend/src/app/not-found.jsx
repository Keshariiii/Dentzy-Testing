'use client';

import React from 'react';
import Link from 'next/link';

/**
 * 404 - Not Found screen.
 * Branded, helpful screen for missing pages and invalid lab cases.
 * Responsive for mobile (<768px) and desktop screens.
 */
import '../styles/error-pages.css';

export default function NotFound() {
  return (
    <div className="dz-error-page">
      <div className="dz-error-card">
        <div className="dz-error-icon dz-error-icon--info">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <span className="dz-error-tag">Page Not Found (404)</span>
        <h1 className="dz-error-title">We cannot find this page</h1>
        <p className="dz-error-desc dz-error-desc--solo">
          The page or dental case order you are looking for does not exist, may have been moved, or has been archived.
        </p>

        <div className="dz-error-actions">
          <Link href="/dashboard" className="dz-error-btn dz-error-btn--primary">
            Return to Dashboard
          </Link>
          <a href="tel:+919170000195" className="dz-error-btn dz-error-btn--secondary">
            Call Lab Support (+91 91700 00195)
          </a>
        </div>
      </div>
    </div>
  );
}
