/**
 * @file config-source.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown when a config source cannot be resolved or loaded.
 */

import { ConfigError } from './config.error';

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a configuration source cannot be resolved or loaded.
 *
 * Typical causes:
 * - Unknown driver name
 * - Driver accessed before being loaded
 * - Source name not found in configuration
 *
 * @example
 * ```typescript
 * try {
 *   manager.source('unknown');
 * } catch (error: Error | any) {
 *   if (error instanceof ConfigSourceError) {
 *     logger.error('Config source failed:', error.message);
 *   }
 * }
 * ```
 */
export class ConfigSourceError extends ConfigError {
  /** Error name for identification. */
  public override readonly name: string = 'ConfigSourceError';

  /** Error code for programmatic handling. */
  public override readonly code: string = 'CONFIG_SOURCE_ERROR';
}
