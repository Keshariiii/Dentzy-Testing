'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstNavCard -- 21st.dev
 *
 * Interactive action/navigation card with tactile spring tap feedback,
 * rounded icon container, title, description, and right chevron.
 * Ponytail: minimal props, zero dependencies beyond framer-motion + cn.
 * Impeccable: no emojis, token colors, shadow elevation, 44px touch targets.
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
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex w-full items-center gap-3.5 rounded-[14px] bg-white p-4 sm:p-[18px_16px]',
        'text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
        'border-none cursor-pointer outline-none transition-shadow duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-[var(--dz-color-primary-muted,#e8f5ee)] text-[var(--dz-color-primary-dark,#1e5038)]',
          'transition-colors duration-200 group-hover:bg-[var(--dz-color-primary-dark,#1e5038)] group-hover:text-white',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.92rem] font-bold text-[#1a1a1a] leading-tight">
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

      <ChevronRight
        size={16}
        strokeWidth={2}
        className="ml-auto shrink-0 text-[#aab] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#1e5038]"
        aria-hidden="true"
      />
    </motion.button>
  );
}

export default TwentyFirstNavCard;
