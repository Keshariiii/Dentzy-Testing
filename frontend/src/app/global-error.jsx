'use client';

/**
 * global-error.jsx -- Root layout crash fallback.
 * Self-contained: inline styles, no external CSS dependencies.
 * Responsive for mobile (<768px) and desktop screens.
 */
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>Dentzy Portal Unavailable</title>
      </head>
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: '#f8faf9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1a2e26',
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '440px',
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
            <AlertTriangle size={28} strokeWidth={2} />
          </div>
          <h1 style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.45rem)',
            fontWeight: 700,
            margin: '0 0 0.75rem',
            color: '#1a2e26',
          }}>
            Dentzy Portal Unavailable
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#527063',
            lineHeight: 1.5,
            margin: '0 0 1.75rem',
          }}>
            A critical error occurred. Please reload the page or contact lab support if the problem persists.
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
              Reload Portal
            </button>
            <a
              href="tel:+919170000195"
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
              Call Lab Support (+91 91700 00195)
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
