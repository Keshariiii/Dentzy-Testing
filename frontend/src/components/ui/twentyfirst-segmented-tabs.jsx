'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstSegmentedTabs — 21st.dev
 * Fluid segmented horizontal tabs with Framer Motion layoutId sliding pill.
 * Theme-aware, supports light & dark modes with CSS custom properties.
 */
export function TwentyFirstSegmentedTabs({
  tabs,
  activeKey,
  onTabChange,
  className,
  layoutId = 'segmented-pill',
  ...props
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted/70 p-1',
        'border border-border',
        'overflow-x-auto scrollbar-none transition-colors duration-200',
        className,
      )}
      role="tablist"
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'relative z-10 px-3 py-1.5 text-xs font-semibold rounded-full',
              'whitespace-nowrap transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              'cursor-pointer select-none',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {tab.label}
              {tab.count != null && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
                    'text-[10px] font-bold rounded-full',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background/80 text-muted-foreground border border-border/50',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TwentyFirstSegmentedTabs;
