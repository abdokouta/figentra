/**
 * @file cache-module-async-options.interface.ts
 * @module @stackra/cache/src/interfaces
 * @description ICacheModuleAsyncOptions interface.
 */

/**
 * Async configuration options for CacheModule.forRootAsync().
 */
export interface ICacheModuleAsyncOptions {
  /** Factory function that returns the cache configuration. */
  useFactory: (...args: any[]) => ICacheModuleConfig | Promise<ICacheModuleConfig>;
  /** DI tokens to inject into the factory function. */
  inject?: any[];
}
