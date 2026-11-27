'use client';

// ponytail: Shared Cloudflare-style status/error shell reusing PortalNavbar and safe optional auth contexts
import React, { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PortalNavbar from './PortalNavbar';
import { AuthContext } from '@/context/AuthContext';
import { StaffAuthContext } from '@/staff/StaffAuthContext';
import { AdminAuthContext } from '@/admin/AdminAuthContext';

export function resolvePortalContext({ pathname = '', user, staff, admin }) {
  if (pathname.startsWith('/admin') || (admin && !pathname.startsWith('/staff') && !pathname.startsWith('/dashboard'))) {
    return {
      backHref: admin ? '/admin/dashboard' : '/login?role=admin',
      backLabel: admin ? 'Back to Admin Dashboard' : 'Back to Admin Login',
      portalBadge: 'Admin Portal',
      navUser: admin
        ? {
            name: admin.displayName || admin.username || 'Admin',
            role: admin.designation || 'Executive',
          }
        : null,
    };
  }

  if (pathname.startsWith('/staff') || (staff && !pathname.startsWith('/dashboard'))) {
    return {
      backHref: staff ? '/staff/dashboard' : '/login?role=staff',
      backLabel: staff ? 'Back to Staff Dashboard' : 'Back to Staff Login',
      portalBadge: 'Staff Portal',
      navUser: staff
        ? {
            name: staff.displayName || staff.username || 'Staff',
            role: staff.designation || 'Lab Staff',
          }
        : null,
    };
  }

  if (pathname.startsWith('/dashboard') || user) {
    return {
      backHref: user ? '/dashboard' : '/login',
      backLabel: user ? 'Back to Dashboard' : 'Back to Login',
      portalBadge: 'Clinical Portal',
      navUser: user
        ? {
            name: user.name || user.clinicName || 'Doctor',
            role: user.clinicName || 'Dentist',
          }
        : null,
    };
  }

  return {
    backHref: '/',
    backLabel: 'Back to Home',
    portalBadge: null,
    navUser: null,
  };
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

export default function PortalStatusPage({
  title,
  eyebrow,
  paragraphs = [],
  actions = null,
  extra = null,
  backHref: backHrefProp,
  backLabel: backLabelProp,
  portalBadge: portalBadgeProp,
  showSupportLine = true,
  children = null,
}) {
  const { user } = useContext(AuthContext) || {};
  const { staff } = useContext(StaffAuthContext) || {};
  const { admin } = useContext(AdminAuthContext) || {};
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname || '');
  }, []);

  const resolved = resolvePortalContext({ pathname, user, staff, admin });
  const backHref = backHrefProp ?? resolved.backHref;
  const backLabel = backLabelProp ?? resolved.backLabel;
  const portalBadge = portalBadgeProp !== undefined ? portalBadgeProp : resolved.portalBadge;

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
              href="/login"
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
              Sign in
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

          {showSupportLine && (
            <p style={{ margin: 0 }}>
              Ask your clinic or lab administrator for help, or contact{' '}
              <a
                href="mailto:support@dentzy.in"
                style={{ color: 'var(--dz-color-primary-accent, #1e5038)', textDecoration: 'underline' }}
              >
                Dentzy Support
              </a>{' '}
              (
              <a
                href="tel:+919503668112"
                style={{ color: 'var(--dz-color-primary-accent, #1e5038)', textDecoration: 'none', fontWeight: 500 }}
              >
                +91 95036 68112
              </a>
              ) if you think this is a mistake.
            </p>
          )}
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
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Login</Link>
            <a href="tel:+919503668112" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>Lab Support</a>
            <a href="mailto:support@dentzy.in" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', color: 'inherit', textDecoration: 'none' }}>support@dentzy.in</a>
          </nav>
          <span>© 2026 Dentzy by Namrata Dental Solutions</span>
        </div>
      </footer>
    </div>
  );
}
