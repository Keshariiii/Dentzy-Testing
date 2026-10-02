'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDashboardUrlState
 * 
 * Synchronizes dashboard tabs/views with URL search parameters and browser history.
 * When the user switches tabs, a new history state is pushed.
 * When the user hits the browser back button or mobile swipe back,
 * it seamlessly returns to the previous tab instead of exiting the application.
 * 
 * Fully compatible with Next.js static exports (output: 'export').
 * 
 * @param {string} paramKey - The URL query param key (e.g. 'view', 'subview', 'tab')
 * @param {string} defaultValue - Fallback value if query param is not present
 * @returns {[string, (val: string, options?: { replace?: boolean }) => void]}
 */
export function useDashboardUrlState(paramKey, defaultValue) {
  // Read initial value safely on client
  const getParamFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return defaultValue;
    const params = new URLSearchParams(window.location.search);
    const val = params.get(paramKey);
    return val !== null && val !== '' ? val : defaultValue;
  }, [paramKey, defaultValue]);

  const [value, setValue] = useState(defaultValue);
  const isInitialMount = useRef(true);

  // Sync on mount
  useEffect(() => {
    const initial = getParamFromUrl();
    if (initial !== value) {
      setValue(initial);
    }
  }, [getParamFromUrl]);

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const currentParam = getParamFromUrl();
      setValue(currentParam);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getParamFromUrl]);

  // Setter that updates URL and history stack
  const updateValue = useCallback((newValue, options = {}) => {
    setValue(newValue);

    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      if (newValue && newValue !== defaultValue) {
        url.searchParams.set(paramKey, newValue);
      } else {
        url.searchParams.delete(paramKey);
      }

      if (options.replace) {
        window.history.replaceState(window.history.state, '', url.pathname + url.search);
      } else {
        // Only push if the URL actually changed to prevent duplicate entries
        if (url.pathname + url.search !== window.location.pathname + window.location.search) {
          window.history.pushState(window.history.state, '', url.pathname + url.search);
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }, [paramKey, defaultValue]);

  return [value, updateValue];
}

export default useDashboardUrlState;
