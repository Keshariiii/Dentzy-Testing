'use client';
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * AnimasterTextShimmer — Animaster Lib
 *
 * Renders text with a smooth animated linear-gradient shimmer
 * transitioning across Dentzy sage-green and forest-charcoal tones.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children  – Text content to shimmer
 * @param {string}  [props.className]       – Additional class names
 * @param {string}  [props.as='span']       – HTML element to render
 * @param {number}  [props.duration=3]      – Animation duration in seconds
 */
export function AnimasterTextShimmer({
  children,
  className,
  as: Component = 'span',
  duration = 3,
  ...props
}) {
  return (
    <Component
      className={cn(
        'inline-block bg-clip-text text-transparent',
        'bg-[length:200%_100%]',
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--dz-color-primary-light, #a3bfb1) 0%, var(--dz-color-charcoal, #1e2824) 40%, var(--dz-color-primary, #708c80) 60%, var(--dz-color-primary-light, #a3bfb1) 100%)',
        animation: `shimmer ${duration}s ease-in-out infinite`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

export default AnimasterTextShimmer;
