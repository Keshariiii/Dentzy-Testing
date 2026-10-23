'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { RotateCcw } from 'lucide-react';

export interface ThankYouAnimationProps {
  onReset: () => void;
}

export function ThankYouAnimation({ onReset }: ThankYouAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center py-6 px-3 space-y-5"
      role="status"
      aria-live="polite"
    >
      {/* 21st.dev kinetic concentric ripple & animated checkmark */}
      <div className="relative flex items-center justify-center py-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-20 h-20 rounded-full bg-primary/20 pointer-events-none"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.08 }}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-md relative z-10"
        >
          <svg
            className="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.22, ease: 'easeOut' }}
              d="M20 6L9 17l-5-5"
            />
          </svg>
        </motion.div>
      </div>

      {/* Typography in Dentzy theme */}
      <div className="space-y-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-2xl font-bold text-primary-accent"
        >
          Thank You!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="text-sm text-charcoal/70 max-w-xs leading-relaxed"
        >
          Your message has reached our Vasai West dental lab team. We will review it and reply within 1 business day.
        </motion.p>
      </div>

      {/* Reset button to send another message */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="pt-2"
      >
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium border-primary/30 text-charcoal hover:border-primary hover:text-primary-accent bg-surface"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Send another message</span>
        </Button>
      </motion.div>
    </motion.div>
  );
}
