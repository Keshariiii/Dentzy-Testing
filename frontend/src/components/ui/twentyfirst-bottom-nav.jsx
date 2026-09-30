'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBottomNav — 21st.dev
 *
 * Floating app-style bottom navigation bar with fluid Framer Motion spring pill.
 * Designed for mobile viewports (< 768px). Uses pure SVG icons with zero emojis.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, icon: (active: boolean) => React.ReactNode }>} props.items
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onChange
 * @param {string} [props.className]
 * @param {string} [props.layoutId='staff-nav-pill']
 */
export function TwentyFirstBottomNav({
  items,
  activeKey,
  onChange,
  className,
  layoutId = 'staff-nav-pill',
}) {
  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around',
        'bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl',
        'p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        'md:hidden',
        className,
      )}
      aria-label="Staff navigation"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative z-10 flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl',
              'transition-colors duration-200 select-none cursor-pointer min-h-[52px]',
              isActive ? 'text-[#1e5038]' : 'text-neutral-500 hover:text-neutral-800',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-[#eef6f2]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center mb-0.5">
              {item.icon(isActive)}
            </span>
            <span
              className={cn(
                'relative z-10 text-[10px] tracking-tight leading-tight',
                isActive ? 'font-bold text-[#1e5038]' : 'font-medium text-neutral-600',
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default TwentyFirstBottomNav;
