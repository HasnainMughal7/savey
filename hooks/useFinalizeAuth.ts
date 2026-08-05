import type { SetActiveNavigate } from '@clerk/expo/types';
import { useCallback, useEffect, useRef, useState } from 'react';

type FinalizableAuth = {
  status: string;
  finalize: (params?: { navigate?: SetActiveNavigate }) => Promise<{ error: unknown | null }>;
};

export function useFinalizeAuth(
  resource: FinalizableAuth,
  navigate: SetActiveNavigate,
  onError: (error: unknown) => void,
  beforeFinalize?: () => void | Promise<void>,
) {
  const finalizingRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const isComplete = resource.status === 'complete';

  useEffect(() => {
    if (!isComplete) {
      finalizingRef.current = false;
      setHasFailed(false);
      return;
    }

    if (hasFailed || finalizingRef.current) return;
    finalizingRef.current = true;

    void Promise.resolve()
      .then(() => beforeFinalize?.())
      .then(() => resource.finalize({ navigate }))
      .then(({ error }) => {
        if (error) {
          finalizingRef.current = false;
          setHasFailed(true);
          onError(error);
        }
      })
      .catch((error: unknown) => {
        finalizingRef.current = false;
        setHasFailed(true);
        onError(error);
      });
  }, [attempt, beforeFinalize, hasFailed, isComplete, navigate, onError, resource]);

  const retry = useCallback(() => {
    finalizingRef.current = false;
    setHasFailed(false);
    setAttempt((current) => current + 1);
  }, []);

  return {
    hasFailed,
    isComplete,
    isFinalizing: isComplete && !hasFailed,
    retry,
  };
}
