/**
 * @file inject-redis-manager.decorator.ts
 * @module @stackra/ts-redis/decorators
 * @description Parameter decorator for injecting the RedisManager
 *   into a service constructor.
 */

import { Inject } from '@stackra/ts-container';
import { REDIS_MANAGER } from '@stackra/contracts';

/**
 * Inject the RedisManager into a service constructor.
 *
 * Use this when you need the manager itself (for dynamic connection
 * resolution, health checks, or reconnection). For a specific client,
 * prefer `@InjectRedis('name')`.
 *
 * @returns A parameter decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HealthService {
 *   constructor(@InjectRedisManager() private readonly redis: IRedisManager) {}
 * }
 * ```
 */
export function InjectRedisManager(): ParameterDecorator {
  return Inject(REDIS_MANAGER);
}
