/**
 * @file use-redis-key.hook.ts
 * @module @stackra/react-redis/hooks/use-redis-key
 * @description React hook for reactive Redis key watching. Supports
 *   polling mode (configurable interval) for key value updates.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRedis } from '../use-redis';

/**
 * Watch a Redis key value reactively via polling.
 *
 * Fetches the key value at the configured interval and re-renders
 * when the value changes. Cleans up the polling timer on unmount.
 *
 * @param key - The Redis key to watch.
 * @param options - Polling configuration.
 * @returns The current value, loading state, error, and refresh function.
 *
 * @example
 * ```tsx
 * function StatusIndicator() {
 *   const { value, loading } = useRedisKey('app:status', { interval: 3000 });
 *   if (loading) return <Spinner />;
 *   return <Text>{value}</Text>;
 * }
 * ```
 */
export function useRedisKey(key: string, options?: IUseRedisKeyOptions): IUseRedisKeyResult {
  const interval = options?.interval ?? 5000;
  const enabled = options?.enabled ?? true;
  const redis = useRedis(options?.connection);

  const [value, setValue] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchValue = useCallback(async () => {
    try {
      const result = await redis.get(key);
      setValue(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [redis, key]);

  useEffect(() => {
    if (!enabled) return undefined;

    void fetchValue();

    timerRef.current = setInterval(() => {
      void fetchValue();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchValue, interval, enabled]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchValue();
  }, [fetchValue]);

  return { value, loading, error, refresh };
}
