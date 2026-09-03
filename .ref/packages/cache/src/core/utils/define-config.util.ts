/**
 * @file define-config.util.ts
 * @module @stackra/cache/core/utils
 * @description Type-safe configuration builder for the cache module.
 *   Provides IDE autocompletion and validation for cache configurations.
 */

import type { ICacheModuleConfig } from '../interfaces';

/**
 * Type-safe configuration builder for the cache module.
 *
 * Returns the config object unchanged — its purpose is to provide
 * TypeScript type checking and IDE autocompletion for cache configurations
 * defined in separate config files.
 *
 * @param config - The cache module configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/cache.config.ts
 * import { IdefineConfig } from '@stackra/cache';
 *
 * export default IdefineConfig({
 *   default: 'memory',
 *   stores: {
 *     memory: { driver: 'memory' },
 *     null: { driver: 'null' },
 *   },
 *   prefix: 'app:',
 *   ttl: 3600,
 * });
 * ```
 */
export function IdefineConfig(config: ICacheModuleConfig): ICacheModuleConfig {
  return config;
}
