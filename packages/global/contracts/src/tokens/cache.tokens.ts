/**
 * @file cache.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the cache system.
 */

/**
 * Configuration namespace for the cache subsystem.
 *
 * String constant used both as the `registerAs(CACHE_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `CacheModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"cache"` and reach the same registration.
 */
export const CACHE_CONFIG = "cache" as const;

/** Token for the CacheManager instance. */
export const CACHE_MANAGER = Symbol.for("CACHE_MANAGER");

/** Metadata key for the @CacheStore() decorator. */
export const CACHE_STORE_METADATA_KEY = "stackra:cache:store";
