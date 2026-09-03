/**
 * @file cache.config.ts
 * @module @stackra/cache/config
 * @description Application-level cache configuration.
 *   Consumed by `CacheModule.forRoot()` at bootstrap.
 */

import { IdefineConfig } from '@stackra/cache';

export default IdefineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Cache Store
  |--------------------------------------------------------------------------
  |
  | This option controls the default cache store that gets used while using
  | the caching API. Of course, you may use other stores whenever you wish.
  | This is the store accessed when calling cache.get() without specifying one.
  |
  */
  default: 'memory',

  /*
  |--------------------------------------------------------------------------
  | Cache Stores
  |--------------------------------------------------------------------------
  |
  | Here you may define all of the cache "stores" for your application as
  | well as their drivers. You may even define multiple stores for the same
  | driver to group types of items stored in your caches.
  |
  | Supported drivers: "memory", "null", "storage", "redis" (via plugin)
  |
  */
  stores: {
    memory: { driver: 'memory' },
    null: { driver: 'null' },
  },

  /*
  |--------------------------------------------------------------------------
  | Cache Key Prefix
  |--------------------------------------------------------------------------
  |
  | When utilizing a RAM-based or shared store such as Redis, there might be
  | other applications using the same cache. For that reason, you may prefix
  | every cache key to avoid collisions.
  |
  */
  prefix: 'app:',

  /*
  |--------------------------------------------------------------------------
  | Default Cache TTL
  |--------------------------------------------------------------------------
  |
  | Here you may specify the default number of seconds that items should
  | remain cached when no explicit TTL is provided to the set/put methods.
  | Set to 0 or Infinity for no default expiration.
  |
  */
  ttl: 3600,
});
