'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstNavCard -- 21st.dev
 * Interactive action/navigation card with tactile spring tap feedback.
 * Fully theme-aware with CSS variables.
 */
export function TwentyFirstNavCard({
  label,
  desc,
  icon,
  onClick,
  badge,
  className,
  ariaLabel,
  ...props
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex w-full items-center gap-3 sm:gap-3.5 rounded-[14px] bg-card p-3.5 sm:p-4',
        'text-left shadow-sm hover:shadow-md',
        'border border-border cursor-pointer outline-none transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-primary/10 text-primary',
          'transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.92rem] font-bold text-foreground leading-tight truncate">
            {label}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        {desc && (
          <p className="mt-0.5 truncate text-[0.76rem] text-muted-foreground leading-snug">
            {desc}
          </p>
        )}
      </div>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.button>
  );
}

export default TwentyFirstNavCard;
