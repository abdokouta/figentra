/**
 * @file inject-redis.decorator.ts
 * @module @stackra/ts-redis/decorators
 * @description Parameter decorator for injecting a named Redis client
 *   into a service constructor.
 */

import { Inject } from '@stackra/ts-container';
import { getRedisClientToken } from '../utils';

/**
 * Inject a named Redis client into a service constructor.
 *
 * Resolves the `IRedisClient` for the specified connection name.
 * When called without a name, injects the default connection.
 *
 * @param name - The connection name from configuration. Omit for default.
 * @returns A parameter decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class CacheService {
 *   constructor(@InjectRedis('cache') private readonly redis: IRedisClient) {}
 * }
 * ```
 */
export function InjectRedis(name?: string): ParameterDecorator {
  return Inject(getRedisClientToken(name));
}
