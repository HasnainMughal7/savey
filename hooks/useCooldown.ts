import { useCallback, useEffect, useState } from 'react';

export function useCooldown(defaultSeconds = 30) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setTimeout(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  const start = useCallback(
    (duration = defaultSeconds) => {
      setSeconds(duration);
    },
    [defaultSeconds],
  );

  const reset = useCallback(() => setSeconds(0), []);

  return {
    isCoolingDown: seconds > 0,
    reset,
    seconds,
    start,
  };
}
