/**
 * @file use-redis-manager.hook.ts
 * @module @stackra/react-redis/hooks/use-redis-manager
 * @description React hook to get the RedisManager instance from DI.
 */

import { useInject } from '@stackra/ts-container/react';
import type { IRedisManager } from '@stackra/contracts';
import { REDIS_MANAGER } from '@stackra/contracts';

/**
 * Get the RedisManager instance from the DI container.
 *
 * Use this when you need the manager itself (for dynamic connection
 * resolution, health checks, or reconnection). For a specific client,
 * prefer `useRedis('name')`.
 *
 * @returns The RedisManager instance.
 *
 * @example
 * ```tsx
 * function HealthDashboard() {
 *   const manager = useRedisManager();
 *   const names = manager.getConnectionNames();
 * }
 * ```
 */
export function useRedisManager(): IRedisManager {
  return useInject<IRedisManager>(REDIS_MANAGER);
}
