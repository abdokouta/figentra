/**
 * @file upstash.backend.ts
 * @module @stackra/ts-redis/backends/upstash
 * @description Upstash HTTP backend implementation. Creates Redis clients
 *   backed by the Upstash REST API. Web-safe — zero Node.js dependencies.
 */

import { Redis } from '@upstash/redis';
import { IInjectable } from '@stackra/ts-container';
import type {
  IRedisBackend,
  IRedisClient,
  RedisClientConfig,
  IUpstashClientConfig,
} from '@stackra/contracts';

import { RedisConfigError } from '../../errors';
import { UpstashClient } from './upstash.client';

/**
 * Upstash HTTP backend.
 *
 * Implements `IRedisBackend` and is registered with `RedisManager`
 * under the `"upstash"` driver key. Creates `UpstashClient` instances
 * backed by the Upstash REST SDK.
 *
 * @example
 * ```typescript
 * const backend = new UpstashBackend();
 * const client = await backend.connect({
 *   driver: 'upstash',
 *   url: 'https://my-redis.upstash.io',
 *   token: 'REPLACE_ME',
 * });
 * ```
 */
@IInjectable()
export class UpstashBackend implements IRedisBackend {
  /**
   * Create a Redis client from Upstash configuration.
   *
   * Validates that the discriminator is `"upstash"` and that the
   * required `url` / `token` fields are populated, then constructs
   * the underlying Upstash HTTP client.
   *
   * @param config - Client configuration. Must be an Upstash variant.
   * @returns A live, ready-to-use Redis client.
   * @throws {RedisConfigError} When config is missing required fields.
   */
  public async connect(config: RedisClientConfig): Promise<IRedisClient> {
    if (config.driver !== 'upstash') {
      throw new RedisConfigError(
        `UpstashBackend received config for driver "${config.driver}". Expected "upstash".`
      );
    }

    const upstashConfig = config as IUpstashClientConfig;

    if (!upstashConfig.url) {
      throw new RedisConfigError('Upstash backend requires a "url" field.');
    }

    if (!upstashConfig.token) {
      throw new RedisConfigError('Upstash backend requires a "token" field.');
    }

    const sdk = new Redis({
      url: upstashConfig.url,
      token: upstashConfig.token,
      retry: upstashConfig.retry as never,
      enableAutoPipelining: upstashConfig.enableAutoPipelining,
    });

    return new UpstashClient(sdk, upstashConfig.name ?? 'upstash');
  }
}
