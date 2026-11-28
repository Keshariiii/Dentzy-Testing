'use client';
import React from 'react';
import { cn } from '../../lib/utils';
import { Ico } from '../common/DashboardIcons';

/**
 * TwentyFirstNavCard -- 21st.dev
 *
 * Interactive action/navigation card with calm border/color feedback,
 * rounded icon container, title, description, and right chevron.
 * Ponytail: plain button with CSS color transitions (no Framer Motion spring bounce).
 *
 * @param {object} props
 * @param {string} props.label - Card title
 * @param {string} props.desc - Subtitle / description
 * @param {React.ReactNode} props.icon - Icon element
 * @param {() => void} props.onClick - Click handler
 * @param {string|number} [props.badge] - Optional badge count/text
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.ariaLabel] - Accessibility label
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
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={cn(
        'group flex w-full items-center gap-3 sm:gap-3.5 rounded-2xl bg-white p-3.5 sm:p-4',
        'text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(30,80,56,0.05)]',
        'border border-[#e2ece6] hover:border-[#1e5038]/30 cursor-pointer outline-none transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-[var(--dz-color-primary-muted,#e8f5ee)] text-[var(--dz-color-primary-dark,#1e5038)]',
          'transition-colors duration-150 group-hover:bg-[var(--dz-color-primary-dark,#1e5038)] group-hover:text-white',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.92rem] font-bold text-[#1a1a1a] leading-tight truncate">
            {label}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        {desc && (
          <p className="mt-0.5 truncate text-[0.76rem] text-[#708c80] leading-snug">
            {desc}
          </p>
        )}
      </div>

      <span className="ml-auto shrink-0 text-[#aab] transition-colors duration-150 group-hover:text-[#1e5038]" aria-hidden="true">
        {Ico.chevronRight(16, 2)}
      </span>
    </button>
  );
}

export default TwentyFirstNavCard;
