/**
 * @file define-config.util.ts
 * @module @stackra/realtime/core/utils
 * @description Type-safe configuration builder for the realtime module.
 *   Provides IDE autocompletion and validation for realtime configurations
 *   defined in separate config files.
 */

import type { IRealtimeModuleOptions } from '../interfaces';

/**
 * Type-safe configuration builder for the realtime module.
 *
 * @param config - The realtime module configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/realtime.config.ts
 * import { IdefineConfig } from '@stackra/realtime';
 *
 * export default IdefineConfig({
 *   default: 'main',
 *   connections: {
 *     main: { driver: 'socketio', url: 'wss://api.example.com' },
 *   },
 * });
 * ```
 */
export function IdefineConfig(config: IRealtimeModuleOptions): IRealtimeModuleOptions {
  return config;
}
