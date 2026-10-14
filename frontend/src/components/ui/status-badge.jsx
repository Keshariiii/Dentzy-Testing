'use client';
import React from 'react';
import { cn } from '../../lib/utils';

const VARIANT_MAP = {
  success: {
    wrap: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
    dot: 'bg-[#17B26A]',
  },
  loading: {
    wrap: 'bg-[#F0F9FF] text-[#026AA2] border-[#B9E6FE]',
    dot: 'bg-[#0BA5EC] animate-pulse',
  },
  warning: {
    wrap: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
    dot: 'bg-[#F79009]',
  },
  danger: {
    wrap: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    dot: 'bg-[#F04438]',
  },
  info: {
    wrap: 'bg-[#F4F6F5] text-[#1E3A2F] border-[#D5E0DB]',
    dot: 'bg-[#4A6A5A]',
  },
  neutral: {
    wrap: 'bg-[#F8FAFC] text-[#475467] border-[#E4E7EC]',
    dot: 'bg-[#98A2B3]',
  },
};

export function mapToAnimatedStatus(status) {
  const s = (status || '').toString().toLowerCase().trim();
  if (['completed', 'success', 'approved', 'paid', 'delivered', 'active', 'on-time', 'present'].includes(s)) return 'success';
  if (['in progress', 'in-progress', 'processing', 'production', 'design', 'qc', 'dispatched', 'loading'].includes(s)) return 'loading';
  if (['pending', 'review', 'partially paid', 'rush', 'half-day', 'warning'].includes(s)) return 'warning';
  if (['cancelled', 'failed', 'rejected', 'overdue', 'blocked', 'danger', 'high', 'urgent', 'absent'].includes(s)) return 'danger';
  if (['received', 'submitted', 'new', 'open', 'info'].includes(s)) return 'info';
  return 'neutral';
}

export function StatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
  children,
  ...props
}) {
  const rawStatus = (status || children || '').toString().trim();
  const variantKey = mapToAnimatedStatus(rawStatus);
  const style = VARIANT_MAP[variantKey] || VARIANT_MAP.neutral;
  const displayLabel = label || children || rawStatus || 'Pending';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold whitespace-nowrap rounded-md border tabular-nums select-none',
        size === 'lg' || size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px] leading-4',
        style.wrap,
        className,
      )}
      {...props}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
