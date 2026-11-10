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
 * @param {Array<{ key: string, label: string, icon: (active: boolean) => React.ReactNode, badge?: number | string }>} props.items
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onChange
 * @param {string} [props.className]
 * @param {string} [props.layoutId='bottom-nav-pill']
 * @param {string} [props.ariaLabel='Navigation']
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
        'border rounded-2xl p-1.5',
        'md:hidden',
        className,
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        borderColor: 'rgba(112, 140, 128, 0.18)',
        boxShadow: [
          '0 4px 16px rgba(30, 80, 56, 0.07)',
          'inset 1px 1px 1px -0.5px rgba(112, 140, 128, 0.42)',
          'inset -1px -1px 1px -0.5px rgba(0, 0, 0, 0.08)',
          'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
          'inset 0 0 10px 4px rgba(112, 140, 128, 0.03)',
        ].join(', '),
      }}
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
              isActive ? 'text-[#1e5038]' : 'text-neutral-500 hover:text-neutral-800',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'rgba(112, 140, 128, 0.14)',
                  border: '1px solid rgba(112, 140, 128, 0.2)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
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
