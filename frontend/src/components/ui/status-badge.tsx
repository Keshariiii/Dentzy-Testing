'use client';
import React from 'react';
import { AnimatedBadge, type AnimatedBadgeProps, type AnimatedBadgeStatus } from './be-ui-animated-badge';
import { cn } from '../../lib/utils';

export function mapToAnimatedStatus(status?: string): AnimatedBadgeStatus {
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

export interface StatusBadgeProps
  extends Omit<AnimatedBadgeProps, 'status' | 'size' | 'pulse' | 'contentKey'> {
  status?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  fixedWidth?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  pulse,
  fixedWidth,
  className = '',
  children,
  ...props
}) => {
  const rawStatus = (status || (typeof children === 'string' ? children : '')).toString().trim();
  const animatedStatus = mapToAnimatedStatus(rawStatus);
  const displayLabel = label || (children ? children : (rawStatus ? rawStatus : 'Pending'));
  const badgeSize = size === 'lg' ? 'md' : 'sm';

  return (
    <AnimatedBadge
      status={animatedStatus}
      size={badgeSize}
      pulse={pulse !== undefined ? pulse : animatedStatus === 'loading'}
      contentKey={typeof displayLabel === 'string' ? displayLabel : undefined}
      className={cn('tracking-normal font-semibold', fixedWidth && 'w-40 justify-center', className)}
      {...props}
    >
      {displayLabel}
    </AnimatedBadge>
  );
};

export default StatusBadge;
