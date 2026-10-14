'use client';
import React from 'react';
import { cn } from '../../lib/utils';

export function SkiperStatCard({
  label,
  value = 0,
  icon,
  className,
  trend = 'neutral',
  trendLabel,
  prefix = '',
  suffix = '',
  onClick,
  ...props
}) {
  const trendColors = {
    up: 'text-[#067647] bg-[#ECFDF3] border-[#ABEFC6]',
    down: 'text-[#B42318] bg-[#FEF3F2] border-[#FECDCA]',
    neutral: 'text-[#475467] bg-[#F8FAFC] border-[#E4E7EC]',
  };

  const formatted = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) : undefined}
      className={cn(
        'group relative rounded-xl border border-[#E2E9E5] bg-white p-4 sm:p-5',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-150',
        onClick && 'cursor-pointer hover:border-[#9BC4B0] hover:shadow-[0_4px_12px_rgba(20,56,39,0.06)] active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#5A6E64] tracking-tight mb-1.5 truncate">
            {label}
          </p>
          <p
            className="text-2xl sm:text-[26px] font-bold text-[#111C17] tracking-tight tabular-nums leading-none"
            style={{ fontFamily: 'var(--dz-font-family-mono, inherit)' }}
          >
            {prefix}{formatted}{suffix}
          </p>
          {trendLabel && (
            <span className={cn('inline-flex items-center px-2 py-0.5 mt-2.5 rounded-md text-[11px] font-medium border', trendColors[trend])}>
              {trendLabel}
            </span>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#F0F5F2] border border-[#E2ECE6] flex items-center justify-center text-[#163E2B]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default SkiperStatCard;
