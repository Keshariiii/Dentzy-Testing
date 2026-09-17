/**
 * useIsMobile — Viewport detection hook for strict mobile/PC separation.
 *
 * Uses `window.matchMedia` for performant, event-driven breakpoint tracking.
 * Returns `true` when the viewport width is below the breakpoint (default 768px).
 * Returns `undefined` during SSR/initial hydration to avoid mismatch.
 *
 * Usage:
 *   import { useIsMobile } from '../hooks/useIsMobile';
 *   const isMobile = useIsMobile();       // true when < 768px, undefined during SSR
 *   const isMobile = useIsMobile(1024);   // true when < 1024px
 */
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  // Start as undefined to signal "not yet resolved" during SSR and initial hydration.
  // This prevents hydration mismatch: server would always render false (PC),
  // but client might be mobile. undefined lets consumers render a neutral state.
  const [isMobile, setIsMobile] = useState(undefined);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Resolve on mount — this is the first client-side paint
    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}
