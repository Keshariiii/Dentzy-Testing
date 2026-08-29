/**
 * useIsMobile — Viewport detection hook for strict mobile/PC separation.
 *
 * Uses `window.matchMedia` for performant, event-driven breakpoint tracking.
 * Returns `true` when the viewport width is below the breakpoint (default 768px).
 *
 * Usage:
 *   import { useIsMobile } from '../hooks/useIsMobile';
 *   const isMobile = useIsMobile();       // true when < 768px
 *   const isMobile = useIsMobile(1024);   // true when < 1024px
 */
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Sync with current state on mount
    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}
