/**
 * @file define-config.util.ts
 * @module @stackra/events/core/utils
 * @description Type-safe configuration builder for the events module.
 *   Provides IDE autocompletion and validation for event configurations
 *   defined in separate config files.
 */

import type { IEventEmitterConfig } from '../interfaces';

/**
 * Type-safe configuration builder for the events module.
 *
 * Returns the config object unchanged — its purpose is to provide
 * TypeScript type checking and IDE autocompletion.
 *
 * @param config - The event emitter configuration object
 * @returns The same config object, fully typed
 *
 * @example
 * ```typescript
 * // config/events.config.ts
 * import { IdefineConfig } from '@stackra/events';
 *
 * export default IdefineConfig({
 *   wildcard: true,
 *   delimiter: '.',
 *   maxListeners: 20,
 *   global: true,
 * });
 * ```
 */
export function IdefineConfig(config: IEventEmitterConfig): IEventEmitterConfig {
  return config;
}
