'use client';
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * VengeanceButton — Vengeance UI
 *
 * Cinematic button with rotating magnetic glow border, subtle
 * glassmorphism backdrop, active press scale-down, and loading state.
 * Colors are sourced from Dentzy's sage-green design tokens.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className]
 * @param {'default'|'outline'|'ghost'|'danger'|'secondary'} [props.variant='default']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.asChild=false]  – Render as Radix Slot
 * @param {boolean} [props.isLoading=false] – Show spinner & disable
 * @param {React.ReactNode} [props.icon]   – Leading icon
 * @param {string}  [props.glowColor]      – Override glow color
 */
export function VengeanceButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  asChild = false,
  isLoading = false,
  icon,
  glowColor,
  disabled,
  ...props
}) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30 });

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
  const isDisabled = disabled || isLoading;

  const variantClasses = {
    default:
      'bg-[#1e5038] text-white hover:bg-[#174430] border-[#1e5038]/30 shadow-sm hover:shadow-md',
    secondary:
      'bg-[#708c80] text-white hover:bg-[#5f7a6e] border-[#708c80]/30 shadow-sm',
    outline:
      'bg-transparent text-[#1e5038] border-[#708c80]/40 hover:bg-[#708c80]/8',
    ghost:
      'bg-transparent text-[#1e2824] border-transparent hover:bg-[#708c80]/8',
    danger:
      'bg-red-600 text-white hover:bg-red-700 border-red-600/30 shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-6 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-8 py-3.5 text-base rounded-xl gap-2',
  };

  const resolvedGlow = glowColor || (variant === 'danger' ? '#ef4444' : 'var(--dz-color-primary, #708c80)');

  return (
    <motion.div
      ref={ref}
      className="relative inline-block group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Glow layer */}
      <motion.div
        className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(120px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${resolvedGlow}33, transparent 70%)`,
          filter: 'blur(16px)',
        }}
      />

      <Comp
        className={cn(
          'relative z-10 inline-flex items-center justify-center',
          'font-semibold border transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#708c80]/50 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer select-none',
          variantClasses[variant] || variantClasses.default,
          sizeClasses[size] || sizeClasses.md,
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </Comp>
    </motion.div>
  );
}

export default VengeanceButton;
