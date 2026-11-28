'use client';
import React from 'react';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import { Icons } from './DashboardIcons';

/**
 * SubViewHeader — Shared sub-page header with accessible back button, title, optional count pill, subtitle, and right action.
 */
export default function SubViewHeader({
  title,
  subtitle,
  count,
  onBack,
  backLabel = 'Back to Settings',
  rightAction = null,
  className = '',
  style,
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {typeof onBack === 'function' && (
          <TwentyFirstIconButton
            icon={Icons.arrowLeft(18)}
            title={backLabel}
            ariaLabel={backLabel}
            onClick={onBack}
            size="lg"
            variant="soft"
            rounded="md"
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--dz-color-text-forest, #1a3028)',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {title}
            </h2>
            {count !== undefined && count !== null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  background: '#e8f5ee',
                  color: '#1e5038',
                  border: '1px solid #c2dcd0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            )}
          </div>
          {subtitle ? (
            <p
              style={{
                color: 'var(--dz-color-sage-muted, #6b8a7a)',
                fontSize: '0.8rem',
                margin: '2px 0 0',
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {rightAction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {rightAction}
        </div>
      ) : null}
    </div>
  );
}
