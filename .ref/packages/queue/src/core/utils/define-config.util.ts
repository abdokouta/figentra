/**
 * @file define-config.util.ts
 * @module @stackra/queue/core/utils
 * @description Type-safe configuration builder for the queue module.
 *   Provides IDE autocompletion and validation for queue configurations
 *   defined in separate config files.
 */

import type { IQueueModuleOptions } from '../interfaces';

/**
 * Type-safe configuration builder for the queue module.
 *
 * @param config - The queue module configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/queue.config.ts
 * import { IdefineConfig } from '@stackra/queue';
 *
 * export default IdefineConfig({
 *   default: 'memory',
 *   connections: {
 *     memory: { driver: 'memory' },
 *     indexeddb: { driver: 'indexeddb', dbName: 'app-queue' },
 *   },
 *   worker: { tries: 3, backoffMs: 1000, timeoutMs: 30000 },
 * });
 * ```
 */
export function IdefineConfig(config: IQueueModuleOptions): IQueueModuleOptions {
  return config;
}
