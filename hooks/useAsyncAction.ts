import { useCallback, useRef, useState } from 'react';

export function useAsyncAction() {
  const lockRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (lockRef.current) return;

    lockRef.current = true;
    setIsRunning(true);

    try {
      await action();
    } finally {
      lockRef.current = false;
      setIsRunning(false);
    }
  }, []);

  return { isRunning, run };
}
