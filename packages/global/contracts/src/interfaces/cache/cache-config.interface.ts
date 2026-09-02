/**
 * @file cache-config.interface.ts
 * @module @stackra/contracts/interfaces/cache
 * @description Cross-package interfaces for the cache module
 *   configuration + individual store configuration.
 *
 *   Promoted from `@stackra/cache/core/interfaces/cache-config.interface.ts`
 *   per `.kiro/steering/contracts-and-decorators-promotion.md` — DEF-02
 *   in the frontend-final-production-review-remediation plan.
 *
 *   Consumers: `@stackra/cache` runtime + any package that wires a
 *   custom cache driver via `CacheModule.forFeature({ stores })`.
 */

/**
 * Cache module configuration.
 *
 * Defines which stores are available, which is the default, and global
 * settings like prefix and TTL.
 */
export interface ICacheModuleConfig {
  /** Name of the default store to use when none is specified. */
  default: string;

  /** Map of store name to its configuration. */
  stores: Record<string, ICacheStoreConfig>;

  /** Global key prefix applied to all stores. */
  prefix?: string;

  /** Global default TTL in seconds. */
  ttl?: number;
}

/**
 * Configuration for a single cache store.
 *
 * The `driver` field determines which store implementation is used.
 * Additional fields are driver-specific.
 */
export interface ICacheStoreConfig {
  /** Driver name (e.g., 'memory', 'null', 'redis'). */
  driver: string;

  /** Store-specific TTL override in seconds. */
  ttl?: number;

  /** Store-specific key prefix. */
  prefix?: string;

  /** Allow additional driver-specific options. */
  [key: string]: unknown;
}
