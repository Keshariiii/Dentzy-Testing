'use client';
import React from 'react';
import { AnimatedBadge } from './be-ui-animated-badge';
import { cn } from '../../lib/utils';

/**
 * Maps arbitrary status strings across the application to AnimatedBadge status variants.
 * @param {string} status
 * @returns {'success' | 'warning' | 'danger' | 'loading' | 'info' | 'neutral'}
 */
export function mapToAnimatedStatus(status) {
  const s = (status || '').toString().toLowerCase().trim();
  if (['completed', 'success', 'approved', 'paid', 'delivered', 'active', 'on-time'].includes(s)) {
    return 'success';
  }
  if (['in progress', 'in-progress', 'processing', 'manufacturing', 'syncing', 'packaging', 'loading'].includes(s)) {
    return 'loading';
  }
  if (['pending', 'review', 'partially paid', 'rush', 'moderate', 'warning'].includes(s)) {
    return 'warning';
  }
  if (['cancelled', 'failed', 'rejected', 'overdue', 'blocked', 'danger', 'high', 'urgent'].includes(s)) {
    return 'danger';
  }
  if (['submitted', 'submited', 'new', 'open', 'info', 'scheduled'].includes(s)) {
    return 'info';
  }
  return 'neutral';
}

/**
 * StatusBadge Component
 * Upgraded to 21st.dev AnimatedBadge: spring physics, rolling Lucide icons, and ambient pulse.
 *
 * @param {object} props
 * @param {string} [props.status] - Status identifier (e.g. "Pending", "Completed", "In Progress", "Paid")
 * @param {string} [props.label] - Optional display label override
 * @param {'sm'|'md'|'lg'} [props.size='sm'] - Sizing option
 * @param {boolean} [props.pulse] - Pulse animation
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} [props.children] - Fallback content if status not passed
 */
export function StatusBadge({
  status,
  label,
  size = 'sm',
  pulse,
  className = '',
  children,
  ...props
}) {
  const rawStatus = (status || children || '').toString().trim();
  const animatedStatus = mapToAnimatedStatus(rawStatus);
  const displayLabel = label || (children ? children : (rawStatus ? rawStatus : 'Pending'));
  const badgeSize = size === 'lg' ? 'md' : 'sm';

  return (
    <AnimatedBadge
      status={animatedStatus}
      size={badgeSize}
      pulse={pulse !== undefined ? pulse : animatedStatus === 'loading'}
      contentKey={displayLabel}
      className={cn('tracking-normal font-semibold', className)}
      {...props}
    >
      {displayLabel}
    </AnimatedBadge>
  );
}

export default StatusBadge;
