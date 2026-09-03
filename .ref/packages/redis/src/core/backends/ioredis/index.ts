/**
 * @file index.ts
 * @module @stackra/ts-redis/backends/ioredis
 * @description Barrel export for the ioredis TCP backend.
 *   Server-only — imports Node's net/tls modules.
 */

export { IoredisBackend } from './ioredis.backend';
export { IoredisClient } from './ioredis.client';
export { IoredisSubscriber } from './ioredis.subscriber';
