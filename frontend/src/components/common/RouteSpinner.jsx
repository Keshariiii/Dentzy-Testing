import React from 'react';

/**
 * RouteSpinner — Unified route-level loading spinner using global `.dz-spinner--lg` inside `.dz-min-vh`.
 */
export default function RouteSpinner({ label = 'Loading...', className = '', style }) {
  return (
    <div
      className={`dz-min-vh ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'var(--dz-color-bg-page, #f0f5f2)',
        fontFamily: 'var(--dz-font-family)',
        ...style,
      }}
    >
      <div className="dz-spinner dz-spinner--lg" aria-hidden="true" />
      {label ? (
        <span
          style={{
            fontSize: '0.84rem',
            fontWeight: 600,
            color: 'var(--dz-color-sage-muted, #6b8a7a)',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
