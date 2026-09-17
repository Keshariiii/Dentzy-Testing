'use client';

/**
 * error.jsx -- App Router error boundary.
 * Catches unhandled React errors within the layout shell.
 * Responsive for mobile (<768px) and desktop screens.
 */
import '../styles/error-pages.css';

export default function Error({ error, reset }) {
  const refId = 'DZ-ERR-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  return (
    <div className="dz-error-page">
      <div className="dz-error-card">
        <div className="dz-error-icon dz-error-icon--error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
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
