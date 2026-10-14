'use client';

import {
  AlertTriangle,
  Check,
  Circle,
  Info,
  LoaderCircle,
  X,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '../../lib/utils';

export const EASE_OUT = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.77, 0, 0.175, 1];
export const EASE_DRAWER = [0.32, 0.72, 0, 1];

export const EASE_OUT_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const SPRING_PRESS = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

export const SPRING_SWAP = {
  type: 'spring',
  stiffness: 460,
  damping: 30,
  mass: 0.55,
};

export const SPRING_PANEL = {
  type: 'spring',
  stiffness: 420,
  damping: 40,
  mass: 0.5,
};

export const SPRING_LAYOUT = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.6,
};

export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
};

const STATUS_CLASS = {
  neutral: 'border-[#e2e8f0] bg-[#f8faf9] text-[#4b5563]',
  info: 'border-[#dbe3eb] bg-[#f1f5f8] text-[#334155]',
  success: 'border-[#c2dece] bg-[#eef6f2] text-[#1e5038]',
  warning: 'border-[#ede5d8] bg-[#fbf8f2] text-[#785b28]',
  danger: 'border-[#eddada] bg-[#fbf3f3] text-[#7a3838]',
  loading: 'border-[#cce2d5] bg-[#eef6f2] text-[#1e5038]',
};

const SIZE_CLASS = {
  sm: 'h-6 gap-1.5 px-2 text-[11px]',
  md: 'h-8 gap-2 px-3 text-xs',
};

const ICON_CLASS = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

const ICONS = {
  neutral: Circle,
  info: Info,
  success: Check,
  warning: AlertTriangle,
  danger: X,
  loading: LoaderCircle,
};

const ICON_ROLL_VARIANTS = {
  initial: {
    opacity: 0.72,
    y: '80%',
    scale: 0.92,
    rotate: -8,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: '0%',
    scale: 1,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      y: SPRING_SWAP,
      scale: SPRING_SWAP,
      rotate: { duration: 0.28, ease: EASE_OUT },
      opacity: { duration: 0.28, ease: EASE_OUT },
      filter: { duration: 0.42, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0.5,
    y: '-80%',
    scale: 0.96,
    rotate: 8,
    filter: 'blur(6px)',
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

const TEXT_ROLL_VARIANTS = {
  initial: {
    opacity: 0.76,
    y: '85%',
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: '0%',
    filter: 'blur(0px)',
    transition: {
      y: SPRING_SWAP,
      opacity: { duration: 0.3, ease: EASE_OUT },
      filter: { duration: 0.42, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0.5,
    y: '-85%',
    filter: 'blur(6px)',
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export function AnimatedBadge({
  status = 'neutral',
  size = 'md',
  children,
  icon,
  showIcon = true,
  pulse = status === 'loading',
  contentKey,
  className,
  ...rest
}) {
  const reduce = useReducedMotion();
  const Icon = ICONS[status] || Circle;

  const resolvedContentKey =
    contentKey ??
    (typeof children === 'string' || typeof children === 'number'
      ? children
      : status);

  return (
    <motion.span
      layout
      transition={SPRING_LAYOUT}
      className={cn(
        'relative inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border font-medium tabular-nums',
        'transition-colors duration-300',
        STATUS_CLASS[status] || STATUS_CLASS.neutral,
        SIZE_CLASS[size] || SIZE_CLASS.md,
        className,
      )}
      {...rest}
    >
      {pulse && !reduce ? (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-current opacity-10"
          animate={{
            scale: [0.94, 1.08, 0.94],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: EASE_IN_OUT,
          }}
        />
      ) : null}

      {showIcon ? (
        <span className="relative z-10 inline-flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status}
              aria-hidden
              data-badge-icon
              variants={ICON_ROLL_VARIANTS}
              initial={reduce ? false : 'initial'}
              animate={reduce ? { opacity: 1 } : 'animate'}
              exit={reduce ? undefined : 'exit'}
              className="inline-flex will-change-transform"
            >
              {status === 'loading' && !reduce && !icon ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="inline-flex"
                >
                  <Icon className={ICON_CLASS[size] || ICON_CLASS.md} />
                </motion.span>
              ) : (
                (icon ?? <Icon className={ICON_CLASS[size] || ICON_CLASS.md} />)
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}

      {children != null ? (
        <span className="relative z-10 inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={resolvedContentKey}
              data-badge-label
              variants={TEXT_ROLL_VARIANTS}
              initial={reduce ? false : 'initial'}
              animate={reduce ? { opacity: 1 } : 'animate'}
              exit={reduce ? undefined : 'exit'}
              className="inline-block will-change-transform"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
    </motion.span>
  );
}

export default AnimatedBadge;
