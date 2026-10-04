'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBgDots — 21st.dev
 *
 * Ambient SVG dot-pattern background with subtle breathing opacity.
 * Place behind content with `absolute inset-0 -z-10`.
 */
export function TwentyFirstBgDots({ className, dotSize = 1.2, gap = 22, color = 'rgba(112, 140, 128, 0.25)' }) {
  const patternId = 'dz-dot-grid';
  return (
    <motion.div
      className={cn('pointer-events-none select-none', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width={gap} height={gap} patternUnits="userSpaceOnUse">
            <circle cx={gap / 2} cy={gap / 2} r={dotSize} fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </motion.div>
  );
}

export default TwentyFirstBgDots;
