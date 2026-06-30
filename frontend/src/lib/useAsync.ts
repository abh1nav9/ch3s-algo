import { useState, useCallback } from 'react';

/**
 * Wraps an async operation with busy/error/result state, so panels don't each
 * repeat the same try/catch/loading boilerplate.
 */
export function useAsync<T>() {
  const [result, setResult] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<T>) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return { result, busy, error, run };
}
