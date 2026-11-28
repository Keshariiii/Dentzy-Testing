'use client';
import React from 'react';

/**
 * PortalMaintenanceBanner — Shared maintenance notice banner across Login, MobileLogin, and portal dashboards.
 */
export default function PortalMaintenanceBanner({
  title = 'Scheduled Portal Maintenance',
  message = 'We are upgrading our laboratory portal to serve you faster. Your patient files and orders are completely safe.',
  expectedBack = 'Expected back online: Today at 6:00 PM IST',
  onRetry,
  checking = false,
  showEmergencyContact = true,
  emergencyPhone = '+919503668112',
  emergencyLabel = 'Emergency: +91 95036 68112',
  variant = 'inline',
  className = '',
  style,
}) {
  const isMobile = variant === 'mobile';
  const isCard = variant === 'card';

  return (
    <div
      role="status"
      className={className}
      style={{
        background: isCard ? '#ffffff' : '#f0f7f3',
        border: '1px solid #d8e6df',
        borderRadius: isCard ? '16px' : '12px',
        padding: isCard ? '20px 22px' : isMobile ? '14px' : '16px',
        margin: isMobile ? '12px 0 16px' : '0 0 18px',
        textAlign: 'left',
        boxShadow: isCard
          ? '0 4px 16px rgba(26, 48, 40, 0.06)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#1e5038',
          fontWeight: 700,
          fontSize: isMobile ? '0.84rem' : '0.86rem',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#d97706',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span>{title}</span>
      </div>

      {message ? (
        <div
          style={{
            fontSize: isMobile ? '0.8rem' : '0.82rem',
            color: '#374151',
            marginTop: '6px',
            lineHeight: 1.45,
          }}
        >
          {message}
        </div>
      ) : null}

      {expectedBack ? (
        <div
          style={{
            fontSize: isMobile ? '0.76rem' : '0.78rem',
            color: '#1e5038',
            fontWeight: 700,
            marginTop: '8px',
          }}
        >
          {expectedBack}
        </div>
      ) : null}

      {(onRetry || showEmergencyContact) && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          {typeof onRetry === 'function' && (
            <button
              type="button"
              onClick={onRetry}
              disabled={checking}
              style={{
                padding: isMobile ? '8px 14px' : '7px 13px',
                minHeight: isMobile ? '44px' : '34px',
                borderRadius: '8px',
                background: '#1e5038',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: checking ? 'not-allowed' : 'pointer',
                opacity: checking ? 0.75 : 1,
              }}
            >
              {checking ? 'Checking...' : 'Check If Live'}
            </button>
          )}

          {showEmergencyContact && emergencyPhone && (
            <a
              href={`tel:${emergencyPhone}`}
              style={{
                padding: isMobile ? '8px 14px' : '7px 13px',
                minHeight: isMobile ? '44px' : '34px',
                borderRadius: '8px',
                background: '#e8f5ee',
                color: '#1e5038',
                border: '1px solid #c2dcd0',
                fontSize: '0.76rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {emergencyLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
