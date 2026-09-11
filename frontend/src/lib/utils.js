import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Standard utility consumed by all registry components (Animaster, Vengeance, Skiper, 21st.dev).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
