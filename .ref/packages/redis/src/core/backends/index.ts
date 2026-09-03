/**
 * @file index.ts
 * @module @stackra/ts-redis/backends
 * @description Barrel export for Redis backends. Only the web-safe Upstash
 *   backend is exported from the main entry. The ioredis backend is available
 *   via the `@stackra/ts-redis/ioredis` subpath.
 */

export { UpstashBackend, UpstashClient } from './upstash';
