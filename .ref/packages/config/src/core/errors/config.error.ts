/**
 * @file config.error.ts
 * @module @stackra/config/core/errors
 * @description Base error class for the config package.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Base error class for all errors thrown by the config package.
 *
 * All specific error classes extend this to provide a consistent
 * error shape with a typed `code` property for programmatic handling.
 *
 * @example
 * ```typescript
 * try {
 *   config.getStringOrThrow('MISSING');
 * } catch (error: Error | any) {
 *   if (error instanceof ConfigError) {
 *     logger.error('Config error:', error.code, error.message);
 *   }
 * }
 * ```
 */
export class ConfigError extends Error {
  /** Error name for identification. */
  public readonly name: string = 'ConfigError';

  /** Error code for programmatic handling. */
  public readonly code: string = 'CONFIG_ERROR';

  /** Optional underlying cause. */
  public readonly cause?: Error;

  /**
   * Create a new ConfigError.
   *
   * @param message - Human-readable error message
   * @param cause - Optional underlying error that caused this failure
   */
  public constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;

    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}
