'use client';

/**
 * global-error.jsx -- Root layout crash fallback.
 * Self-contained (inline styles only, no Providers/CSS dependencies).
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dentzy Portal Unavailable</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          color: '#1e2824',
          fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
            padding: '0 28px',
            borderBottom: '1px solid rgba(112, 140, 128, 0.12)',
            boxSizing: 'border-box',
          }}
        >
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/dentzy-logo-v2.png" alt="Dentzy" style={{ height: '32px', width: 'auto', display: 'block' }} />
          </a>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
              padding: '0 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1e5038',
              textDecoration: 'none',
            }}
          >
            Sign in
          </a>
        </header>

        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '640px',
            margin: '0 auto',
            padding: 'clamp(48px, 10vh, 96px) 24px 48px',
            boxSizing: 'border-box',
          }}
        >
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '44px',
              marginBottom: '16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#4a6a5a',
              textDecoration: 'none',
            }}
          >
            <span>&lsaquo; Back to Home</span>
          </a>

          <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 600, color: '#4a6a5a' }}>
            Critical Error
          </p>

          <h1
            style={{
              margin: '0 0 16px',
              fontSize: 'clamp(1.85rem, 4vw, 2.35rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#1e2824',
            }}
          >
            Dentzy Portal Unavailable
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#444444',
              maxWidth: '50ch',
            }}
          >
            <p style={{ margin: 0 }}>
              A critical error occurred while loading the application shell. Your patient files and orders are safe.
            </p>
            <p style={{ margin: 0 }}>
              Reload the portal to recover, or contact{' '}
              <a href="mailto:support@dentzy.in" style={{ color: '#1e5038', textDecoration: 'underline' }}>
                Dentzy Support
              </a>{' '}
              (
              <a href="tel:+919503668112" style={{ color: '#1e5038', textDecoration: 'none', fontWeight: 500 }}>
                +91 95036 68112
              </a>
              ) if the issue persists.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '6px',
                backgroundColor: '#1e5038',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reload Portal
            </button>
            <a
              href="tel:+919503668112"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#1e5038',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
              }}
            >
              Call Lab Support
            </a>
          </div>
        </main>

        <footer
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '8px 24px',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} aria-label="Support links">
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Home</a>
              <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Login</a>
              <a href="tel:+919503668112" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Lab Support</a>
              <a href="mailto:support@dentzy.in" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>support@dentzy.in</a>
            </nav>
            <span>© 2026 Dentzy by Namrata Dental Solutions</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
