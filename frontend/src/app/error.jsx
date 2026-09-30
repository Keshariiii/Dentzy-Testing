'use client';

/**
 * error.jsx -- App Router error boundary.
 * Catches unhandled React errors within the layout shell.
 * Responsive for mobile (<768px) and desktop screens.
 */
import '../styles/error-pages.css';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  const refId = 'DZ-ERR-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  return (
    <div className="dz-error-page">
      <div className="dz-error-card">
        <div className="dz-error-icon dz-error-icon--error">
          <AlertTriangle size={28} strokeWidth={2} />
        </div>

        <span className="dz-error-tag">Something went wrong</span>
        <h1 className="dz-error-title">We hit a technical issue</h1>
        <p className="dz-error-desc">
          An unexpected error occurred while loading this view. Your data has not been affected.
        </p>
        <p className="dz-error-ref">Reference: {refId}</p>

        <div className="dz-error-actions">
          <button onClick={() => reset()} className="dz-error-btn dz-error-btn--primary">
            Try Again
          </button>
          <a href="/dashboard" className="dz-error-btn dz-error-btn--secondary">
            Return to Dashboard
          </a>
          <a href="tel:+919170000195" className="dz-error-btn dz-error-btn--ghost">
            Call Lab Support (+91 91700 00195)
          </a>
        </div>
      </div>
    </div>
  );
}
