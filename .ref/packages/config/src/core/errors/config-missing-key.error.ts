/**
 * @file config-missing-key.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown when a required configuration key is missing.
 */

import { ConfigError } from './config.error';

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a required configuration key is missing.
 *
 * Thrown by `getOrThrow`, `getStringOrThrow`, `getNumberOrThrow`,
 * `getBoolOrThrow` when the requested key resolves to `undefined`.
 *
 * @example
 * ```typescript
 * try {
 *   config.getStringOrThrow('DB_HOST');
 * } catch (error: Error | any) {
 *   if (error instanceof ConfigMissingKeyError) {
 *     logger.error('Missing required config:', error.message);
 *   }
 * }
 * ```
 */
export class ConfigMissingKeyError extends ConfigError {
  /** Error name for identification. */
  public override readonly name: string = 'ConfigMissingKeyError';

  /** Error code for programmatic handling. */
  public override readonly code: string = 'CONFIG_MISSING_KEY';
}
