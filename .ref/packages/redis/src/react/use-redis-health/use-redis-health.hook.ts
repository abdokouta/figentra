/**
 * @file use-redis-health.hook.ts
 * @module @stackra/react-redis/hooks/use-redis-health
 * @description React hook for monitoring Redis connection health status.
 *   Polls the health check endpoint and reports status reactively.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRedisManager } from '../use-redis-manager';

/**
 * Monitor Redis connection health status.
 *
 * Polls the health check at the configured interval and reports
 * the current status. Cleans up on unmount.
 *
 * @param name - The connection name. Omit for default.
 * @param options - Health check configuration.
 * @returns The current health status and check function.
 *
 * @example
 * ```tsx
 * function RedisStatus() {
 *   const { status } = useRedisHealth('main', { interval: 5000 });
 *   return <Badge color={status === 'healthy' ? 'green' : 'red'}>{status}</Badge>;
 * }
 * ```
 */
export function useRedisHealth(
  name?: string,
  options?: IUseRedisHealthOptions
): IUseRedisHealthResult {
  const interval = options?.interval ?? 10_000;
  const enabled = options?.enabled ?? true;
  const manager = useRedisManager();

  const [status, setStatus] = useState<RedisHealthStatus>('disconnected');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performCheck = useCallback(async () => {
    try {
      const healthy = await manager.healthCheck(name);
      setStatus(healthy ? 'healthy' : 'degraded');
      setLastCheckedAt(Date.now());
    } catch {
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [manager, name]);

  useEffect(() => {
    if (!enabled) return undefined;

    void performCheck();

    timerRef.current = setInterval(() => {
      void performCheck();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [performCheck, interval, enabled]);

  const check = useCallback(async () => {
    setLoading(true);
    await performCheck();
  }, [performCheck]);

  return { status, loading, lastCheckedAt, check };
}
