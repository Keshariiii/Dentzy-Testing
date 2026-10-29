'use client';
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBadge — 21st.dev
 * Micro-badge with optional pulsing live indicator dot.
 * Semantic status colors compatible with both light and dark themes.
 */
const variantStyles = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  'in-progress': {
    bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  paid: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  default: {
    bg: 'bg-muted/80 border border-border',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
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
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-[11px] font-semibold leading-none select-none transition-colors duration-150',
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
