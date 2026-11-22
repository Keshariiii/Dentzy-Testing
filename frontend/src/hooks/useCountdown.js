import { useState, useEffect, useCallback } from 'react';

export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const start = useCallback((secs) => {
    setSeconds(secs !== undefined ? secs : initialSeconds);
  }, [initialSeconds]);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  return {
    seconds,
    isActive: seconds > 0,
    start,
    reset,
  };
}

export default useCountdown;
