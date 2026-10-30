'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstSegmentedTabs — 21st.dev
 *
 * Fluid segmented horizontal tabs with Framer Motion layoutId
 * sliding pill. Touch-friendly, compact for mobile.
 *
 * @param {object}  props
 * @param {Array<{key:string, label:string, count?:number}>} props.tabs
 * @param {string}  props.activeKey        – Currently active tab key
 * @param {function} props.onTabChange     – (key: string) => void
 * @param {string}  [props.className]
 * @param {string}  [props.layoutId='segmented-pill'] – Unique Framer layoutId
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
        'inline-flex items-center gap-1 rounded-full bg-page p-1',
        'border border-border-light',
        'overflow-x-auto scrollbar-none',
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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              'cursor-pointer select-none',
              isActive
                ? 'text-white'
                : 'text-charcoal/60 hover:text-charcoal',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.count != null && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
                    'text-[10px] font-bold rounded-full',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-charcoal/8 text-charcoal/50',
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
