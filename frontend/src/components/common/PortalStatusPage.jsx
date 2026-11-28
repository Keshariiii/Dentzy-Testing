'use client';

// ponytail: Shared Cloudflare-style status/error shell reusing PortalNavbar and safe optional auth contexts
import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PortalNavbar from './PortalNavbar';
import { AuthContext } from '@/context/AuthContext';
import { StaffAuthContext } from '@/staff/StaffAuthContext';
import { AdminAuthContext } from '@/admin/AdminAuthContext';
import {
  resolvePortalContext,
  getPortalFooterLinks,
} from '@/utils/portalStatusPov';

export { resolvePortalContext };

/**
 * React hook returning the resolved POV ('dentist' | 'lab' | 'guest'),
 * auth hydration state, and portal navigation targets.
 */
export function usePortalContext(povOverride = null) {
  const authCtx = useContext(AuthContext);
  const staffCtx = useContext(StaffAuthContext);
  const adminCtx = useContext(AdminAuthContext);

  const [loc, setLoc] = useState({ pathname: '', search: '' });

  useEffect(() => {
    setLoc({
      pathname: window.location.pathname || '',
      search: window.location.search || '',
    });
  }, []);

  const resolved = resolvePortalContext({
    pathname: loc.pathname,
    search: loc.search,
    user: authCtx?.user || null,
    staff: staffCtx?.staff || null,
    admin: adminCtx?.admin || null,
    pov: povOverride,
  });

  const loading = Boolean(authCtx?.loading || staffCtx?.loading || adminCtx?.loading);
  return { ...resolved, loading };
}

export const statusBtnPrimaryStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--dz-space-2, 8px)',
  minHeight: '44px',
  padding: '0 var(--dz-space-5, 20px)',
  borderRadius: 'var(--dz-radius-sm, 6px)',
  backgroundColor: 'var(--dz-color-primary-accent, #1e5038)',
  color: 'var(--dz-color-white, #ffffff)',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'inherit',
};

export const statusBtnSecondaryStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--dz-space-2, 8px)',
  minHeight: '44px',
  padding: '0 var(--dz-space-5, 20px)',
  borderRadius: 'var(--dz-radius-sm, 6px)',
  backgroundColor: 'var(--dz-color-white, #ffffff)',
  color: 'var(--dz-color-primary-accent, #1e5038)',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: '1px solid var(--dz-color-border, #e2e8f0)',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'inherit',
};

/** Renders a configured status action descriptor as a Link, anchor, or reload button. */
export function StatusActionButton({ action, variant = 'primary' }) {
  if (!action) return null;
  const style = variant === 'primary' ? statusBtnPrimaryStyle : statusBtnSecondaryStyle;

  if (action.type === 'reload') {
    return (
      <button type="button" onClick={() => window.location.reload()} style={style}>
        {action.label}
      </button>
    );
  }

  if (action.external) {
    return (
      <a href={action.href} style={style}>
        {action.label}
      </a>
    );
  }

  return (
    <Link href={action.href} style={style}>
      {action.label}
    </Link>
  );
}

function renderSupportLine(portal) {
  const linkStyle = {
    color: 'var(--dz-color-primary-accent, #1e5038)',
    textDecoration: 'underline',
  };
  const phoneStyle = {
    color: 'var(--dz-color-primary-accent, #1e5038)',
    textDecoration: 'none',
    fontWeight: 500,
  };

  if (portal.pov === 'lab') {
    if (portal.isGuest) {
      return (
        <p style={{ margin: 0 }}>
          Sign in with your Dentzy Staff or Executive Admin credentials to continue.
        </p>
      );
    }
    return (
      <p style={{ margin: 0 }}>
        Internal Lab Notice: If this persists across refreshes, flag it to Executive Admin (CEO / CTO) so the lab team can inspect it.
      </p>
    );
  }

  if (portal.pov === 'dentist') {
    return (
      <p style={{ margin: 0 }}>
        Need help with your clinic account or billing? Contact{' '}
        <a href="mailto:support@dentzy.in" style={linkStyle}>
          Dentzy Lab Desk
        </a>{' '}
        (
        <a href="tel:+919503668112" style={phoneStyle}>
          +91 95036 68112
        </a>
        ).
      </p>
    );
  }

  return (
    <p style={{ margin: 0 }}>
      Sign in with your Dentzy Clinic or Lab account, or contact{' '}
      <a href="mailto:support@dentzy.in" style={linkStyle}>
        Dentzy Support
      </a>{' '}
      (
      <a href="tel:+919503668112" style={phoneStyle}>
        +91 95036 68112
      </a>
      ) if you think this is a mistake.
    </p>
  );
}

export default function PortalStatusPage({
  title,
  eyebrow,
  paragraphs = [],
  actions = null,
  extra = null,
  backHref: backHrefProp,
  backLabel: backLabelProp,
  portalBadge: portalBadgeProp,
  pov: povProp = null,
  portalContext: portalContextProp = null,
  showSupportLine = true,
  children = null,
}) {
  const detectedPortal = usePortalContext(povProp);
  const resolved = portalContextProp || detectedPortal;

  const backHref = backHrefProp ?? resolved.backHref;
  const backLabel = backLabelProp ?? resolved.backLabel;
  const portalBadge = portalBadgeProp !== undefined ? portalBadgeProp : resolved.portalBadge;
  const footerLinks = getPortalFooterLinks(resolved);
  const navSignInHref = resolved.pov === 'lab' ? '/login?role=staff' : '/login';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--dz-color-white, #ffffff)',
        color: 'var(--dz-color-charcoal, #1e2824)',
        fontFamily: 'var(--dz-font-family, system-ui, sans-serif)',
      }}
    >
      <PortalNavbar
        logoHref={backHref}
        portalBadge={portalBadge}
        user={resolved.navUser}
        actions={
          !resolved.navUser ? (
            <Link
              href={navSignInHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--dz-color-primary-accent, #1e5038)',
                textDecoration: 'none',
                padding: '0 var(--dz-space-3, 12px)',
              }}
            >
              {resolved.pov === 'lab' ? 'Lab Sign In' : 'Sign In'}
            </Link>
          ) : null
        }
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          padding: 'clamp(48px, 10vh, 96px) var(--dz-space-6, 24px) var(--dz-space-12, 48px)',
          boxSizing: 'border-box',
        }}
      >
        <Link
          href={backHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--dz-space-1, 4px)',
            minHeight: '44px',
            marginBottom: 'var(--dz-space-4, 16px)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--dz-color-primary-dark, #4a6a5a)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} strokeWidth={2} />
          <span>{backLabel}</span>
        </Link>

        {eyebrow && (
          <p
            style={{
              margin: '0 0 var(--dz-space-2, 8px)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--dz-color-primary-dark, #4a6a5a)',
            }}
          >
            {eyebrow}
          </p>
        )}

        <h1
          style={{
            margin: '0 0 var(--dz-space-4, 16px)',
            fontSize: 'clamp(1.85rem, 4vw, 2.35rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: 'var(--dz-color-charcoal, #1e2824)',
          }}
        >
          {title}
        </h1>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dz-space-3, 12px)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: 'var(--dz-color-text-body, #444444)',
            maxWidth: '50ch',
          }}
        >
          {paragraphs.map((text, idx) => (
            <p key={idx} style={{ margin: 0 }}>
              {text}
            </p>
          ))}

          {children}

          {showSupportLine && renderSupportLine(resolved)}
        </div>

        {extra}

        {actions && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--dz-space-3, 12px)',
              marginTop: 'var(--dz-space-6, 24px)',
            }}
          >
            {actions}
          </div>
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--dz-color-border, #e2e8f0)',
          padding: 'var(--dz-space-2, 8px) var(--dz-space-6, 24px)',
          fontSize: '0.78rem',
          color: 'var(--dz-color-text-muted, #64748b)',
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
            gap: 'var(--dz-space-3, 12px)',
          }}
        >
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--dz-space-4, 16px)' }} aria-label="Support links">
            {footerLinks.map((item) =>
              item.external ? (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <span>© 2026 Dentzy by Namrata Dental Solutions</span>
        </div>
      </footer>
    </div>
  );
}
