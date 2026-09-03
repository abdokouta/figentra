/**
 * @file redis-event-transport-config.interface.ts
 * @module @stackra/redis/src/interfaces
 * @description IRedisEventTransportConfig interface.
 */

/** Configuration for the Redis event transport. */
export interface IRedisEventTransportConfig {
  /** Redis connection name to use. Default: 'default'. */
  connection?: string;
  /** Channel prefix for Redis pub/sub keys. Default: 'events:'. */
  prefix?: string;
  /** Patterns to subscribe to. Default: ['*'] (all events). */
  patterns?: string[];
  /** Events to exclude from broadcasting. */
  exclude?: string[];
}
