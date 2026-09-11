'use client';
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBadge — 21st.dev
 *
 * Micro-badge with optional pulsing live indicator dot.
 * Semantic variants matching Dentzy status colors.
 *
 * @param {object}  props
 * @param {string}  props.children          – Badge text
 * @param {'pending'|'approved'|'rejected'|'in-progress'|'paid'|'default'} [props.variant='default']
 * @param {boolean} [props.pulse=false]     – Show pulsing dot
 * @param {string}  [props.className]
 */
const variantStyles = {
  pending: {
    bg: 'bg-warning-bg',
    text: 'text-warning-text',
    dot: 'bg-warning',
  },
  approved: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    dot: 'bg-success',
  },
  rejected: {
    bg: 'bg-error-bg',
    text: 'text-error-text',
    dot: 'bg-error',
  },
  'in-progress': {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    dot: 'bg-info',
  },
  paid: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    dot: 'bg-success',
  },
  default: {
    bg: 'bg-page',
    text: 'text-charcoal/70',
    dot: 'bg-charcoal/40',
  },
};

export function TwentyFirstBadge({
  children,
  variant = 'default',
  pulse = false,
  className,
  ...props
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[11px] font-semibold leading-none',
        styles.bg,
        styles.text,
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              styles.dot,
            )}
          />
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              styles.dot,
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

export default TwentyFirstBadge;
