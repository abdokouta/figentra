/**
 * @file cache-manager.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the cache manager service.
 */

/** Injection token for `ICacheManager`. */
export const CACHE_MANAGER: unique symbol = Symbol.for("CACHE_MANAGER");
