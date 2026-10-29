'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBottomNav — 21st.dev
 * Floating app-style bottom navigation bar with fluid Framer Motion spring pill.
 * Fully theme-aware with support for OLED dark surfaces.
 */
export function TwentyFirstBottomNav({
  items,
  activeKey,
  onChange,
  className,
  layoutId = 'bottom-nav-pill',
  ariaLabel = 'Navigation',
}) {
  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around',
        'bg-card/95 backdrop-blur-md border border-border rounded-2xl',
        'p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
        'md:hidden transition-colors duration-200',
        className,
      )}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const hasBadge = item.badge != null && (typeof item.badge !== 'number' || item.badge > 0);

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
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center mb-0.5">
              {item.icon(isActive)}
              {hasBadge && (
                <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none">
                  {item.badge}
                </span>
              )}
            </span>
            <span
              className={cn(
                'relative z-10 text-[10px] tracking-tight leading-tight',
                isActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground',
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
