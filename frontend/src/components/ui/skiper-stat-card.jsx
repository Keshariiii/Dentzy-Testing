'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SkiperStatCard — Skiper UI
 *
 * Motion-forward summary card with:
 * - Mouse-tracking radial gradient spotlight
 * - Dynamic counter roll-up animation
 * - Touch/click feedback
 * - Status icon badge with soft mint background
 * - Optional trend indicator (up/down/neutral)
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
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const [rendered, setRendered] = useState(0);

  const spotlight = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(112, 140, 128, 0.1), transparent 80%)`;

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v) => setRendered(v));
    return unsubscribe;
  }, [displayValue]);

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    neutral: 'text-gray-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4',
        'cursor-pointer select-none',
        'transition-all duration-200 hover:shadow-md hover:border-[#708c80]/20',
        className,
      )}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      {...props}
    >
      {/* Mouse spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{ background: spotlight }}
      />

      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1e5038] via-[#708c80] to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#1e2824] tabular-nums">
            {prefix}
            <motion.span>{rendered.toLocaleString('en-IN')}</motion.span>
            {suffix}
          </p>
          {trendLabel && (
            <p className={cn('text-xs font-medium mt-1.5 flex items-center gap-1', trendColors[trend])}>
              <span className="text-sm">{trendIcons[trend]}</span>
              {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#f0f5f2] flex items-center justify-center text-[#1e5038]">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SkiperStatCard;
