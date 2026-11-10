'use client';
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { LiquidGlassButton } from './ui/apple-tahoe-liquid-glass-button';

/**
 * ScrollToTop — Circular progress ring with real Apple-Tahoe liquid glass.
 * Glass bends content behind it; interactive spring physics on press/hover.
 */
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > 300);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const size = 44;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-24 right-4 z-50 sm:bottom-8 sm:right-8"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <LiquidGlassButton
            size="icon"
            appearance="light"
            material="clear"
            interactive
            motion="full"
            refraction={18}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            style={{ position: 'relative', width: size, height: size }}
          >
            {/* Progress ring */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              aria-hidden
            >
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="rgba(112, 140, 128, 0.15)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="#1e5038"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
              />
            </svg>
            <ChevronUp className="w-4 h-4 text-[#1e5038] relative z-10" />
          </LiquidGlassButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
