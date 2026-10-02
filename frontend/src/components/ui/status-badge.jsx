'use client';
import React from 'react';
import { cn } from '../../lib/utils';

const VARIANT_CONFIGS = {
  // Pending
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  // Approved / Completed / Paid
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  // In Progress / Production / Design
  'in progress': {
    label: 'In Progress',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
  production: {
    label: 'Milling',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dotClass: 'bg-indigo-500',
  },
  design: {
    label: 'CAD Design',
    className: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dotClass: 'bg-sky-500',
  },
  qc: {
    label: 'QC Check',
    className: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
  },
  dispatched: {
    label: 'Dispatch',
    className: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dotClass: 'bg-teal-500',
  },
  // Rejected / Cancelled / Overdue
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-50 text-red-700 border-red-200/80',
    dotClass: 'bg-red-500',
  },
};

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  pulse = false,
  className = '',
  children,
}) {
  const normKey = (status || children || '').toString().toLowerCase().trim();
  const config = VARIANT_CONFIGS[normKey] || {
    label: status || children || 'Unknown',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
  };

  const isPulse = pulse || normKey === 'pending' || normKey === 'in progress';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.className,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {isPulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                config.dotClass
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', config.dotClass)} />
        </span>
      )}
      <span>{children || config.label}</span>
    </span>
  );
}

export default StatusBadge;
