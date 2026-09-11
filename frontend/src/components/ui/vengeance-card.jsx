'use client';
import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * VengeanceCard — Vengeance UI
 *
 * Interactive spotlight cursor-tracking glow card container.
 * The spotlight follows the mouse with a subtle sage-green radial glow,
 * styled to match Dentzy's design language.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className]
 * @param {string}  [props.spotlightColor] – Override spotlight color
 */
export function VengeanceCard({
  children,
  className,
  spotlightColor,
  ...props
}) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const resolvedColor = spotlightColor || 'rgba(112, 140, 128, 0.15)';
  const spotlight = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${resolvedColor}, transparent 80%)`;

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border',
        'bg-surface transition-shadow duration-300',
        'hover:shadow-lg',
        className,
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {/* Spotlight overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlight }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default VengeanceCard;
