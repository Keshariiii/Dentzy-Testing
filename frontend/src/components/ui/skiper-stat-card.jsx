'use client';
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SkiperStatCard — Skiper UI
 *
 * Motion-forward summary card with dynamic counter roll-up,
 * touch feedback, status icon badge, and optional change trend.
 *
 * @param {object}  props
 * @param {string}  props.label           – Metric label (e.g. "Total Dentists")
 * @param {number}  props.value           – Numeric value to display
 * @param {React.ReactNode} [props.icon]  – Icon element
 * @param {string}  [props.className]
 * @param {'up'|'down'|'neutral'} [props.trend='neutral'] – Trend direction
 * @param {string}  [props.trendLabel]    – e.g. "+12 this week"
 * @param {string}  [props.prefix]        – e.g. "₹"
 * @param {string}  [props.suffix]        – e.g. "%"
 * @param {function} [props.onClick]
 */
export function SkiperStatCard({
  label,
  value,
  icon,
  className,
  trend = 'neutral',
  trendLabel,
  prefix = '',
  suffix = '',
  onClick,
  ...props
}) {
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v) => setRendered(v));
    return unsubscribe;
  }, [displayValue]);

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-charcoal/50',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-surface p-4',
        'cursor-pointer select-none',
        'transition-shadow duration-200 hover:shadow-md',
        className,
      )}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      {...props}
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-charcoal/60 uppercase tracking-wide mb-1 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-charcoal tabular-nums">
            {prefix}
            <motion.span>{rendered.toLocaleString('en-IN')}</motion.span>
            {suffix}
          </p>
          {trendLabel && (
            <p className={cn('text-xs font-medium mt-1 flex items-center gap-1', trendColors[trend])}>
              <span>{trendIcons[trend]}</span>
              {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SkiperStatCard;
