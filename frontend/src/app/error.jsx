'use client';

/**
 * error.jsx -- App Router error boundary.
 * Catches unhandled React errors within the layout shell.
 * Responsive for mobile (<768px) and desktop screens.
 */
export default function Error({ error, reset }) {
  const refId = 'DZ-ERR-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      background: '#f8faf9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e2ece6',
        borderRadius: '16px',
        padding: 'clamp(1.75rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 1.25rem',
          borderRadius: '50%',
          background: '#fef2f2',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <span style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#6b8a7a',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'inline-block',
        }}>
          Something went wrong
        </span>
        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.45rem)',
          fontWeight: 700,
          margin: '0.5rem 0 0.75rem',
          color: '#1a2e26',
        }}>
          We hit a technical issue
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#527063', lineHeight: 1.5, margin: '0 0 0.5rem' }}>
          An unexpected error occurred while loading this view. Your data has not been affected.
        </p>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 1.75rem' }}>
          Reference: {refId}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '46px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              background: '#1e5038',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.92rem',
              border: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '46px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              background: '#f0f5f2',
              color: '#1e5038',
              fontWeight: 600,
              fontSize: '0.92rem',
              textDecoration: 'none',
              border: '1px solid #dbe7e0',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            Return to Dashboard
          </a>
          <a
            href="tel:+919170000195"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              padding: '0.6rem 1rem',
              color: '#6b8a7a',
              fontWeight: 500,
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Call Lab Support (+91 91700 00195)
          </a>
        </div>
      </div>
    </div>
  );
}
