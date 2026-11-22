import { useEffect, useRef } from 'react';

export function usePolling(fn, intervalMs = 30000, enabled = true) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handlePoll = () => {
      if (document.hidden) return;
      fnRef.current?.();
    };

    const timer = setInterval(handlePoll, intervalMs);
    window.addEventListener('focus', handlePoll);
    document.addEventListener('visibilitychange', handlePoll);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handlePoll);
      document.removeEventListener('visibilitychange', handlePoll);
    };
  }, [intervalMs, enabled]);
}

export default usePolling;
