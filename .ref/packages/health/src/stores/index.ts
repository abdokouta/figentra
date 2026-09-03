/**
 * @file index.ts
 * @module @stackra/nestjs-health/stores
 * @description Barrel export for health result stores.
 */

export { InMemoryResultStore } from './in-memory-result.store';
export {
  RedisResultStore,
  HEALTH_REDIS_CONNECTION,
  type IRedisResultStoreConfig,
  type IRedisClient,
} from './redis-result.store';
export {
  DatabaseResultStore,
  HEALTH_ENTITY_MANAGER,
  type IDatabaseResultStoreConfig,
  type IEntityManagerLike,
} from './database-result.store';
