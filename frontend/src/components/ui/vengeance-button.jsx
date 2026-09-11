'use client';
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

/**
 * VengeanceButton — Vengeance UI
 *
 * Cinematic button with rotating magnetic glow border, subtle
 * glassmorphism backdrop, and active press scale-down.
 * Colors are sourced from Dentzy's sage-green design tokens.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className]
 * @param {'default'|'outline'|'ghost'} [props.variant='default']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.asChild=false]  – Render as Radix Slot
 * @param {string}  [props.glowColor]      – Override glow color
 */
export function VengeanceButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  asChild = false,
  glowColor,
  ...props
}) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const glowX = useTransform(smoothX, (v) => `${v}px`);
  const glowY = useTransform(smoothY, (v) => `${v}px`);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(rect.width / 2);
    mouseY.set(rect.height / 2);
  };

  const Comp = asChild ? Slot : 'button';

  const variantClasses = {
    default:
      'bg-primary text-white hover:bg-primary-dark border-primary/30',
    outline:
      'bg-transparent text-primary border-primary/40 hover:bg-primary-muted',
    ghost:
      'bg-transparent text-charcoal border-transparent hover:bg-primary-muted',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  const resolvedGlow = glowColor || 'var(--dz-color-primary, #708c80)';

  return (
    <motion.div
      ref={ref}
      className="relative inline-block group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
    >
      {/* Glow layer */}
      <motion.div
        className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(120px circle at ${glowX.get()}px ${glowY.get()}px, ${resolvedGlow}44, transparent 70%)`,
          left: glowX,
          top: glowY,
          width: '240px',
          height: '240px',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(20px)',
        }}
      />

      <Comp
        className={cn(
          'relative z-10 inline-flex items-center justify-center gap-2',
          'font-semibold border transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer select-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    </motion.div>
  );
}

export default VengeanceButton;
