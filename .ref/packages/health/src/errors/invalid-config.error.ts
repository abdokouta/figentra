/**
 * @file invalid-config.error.ts
 * @module @stackra/nestjs-health/errors
 * @description Error thrown when health module configuration is invalid.
 */

/**
 * Thrown during module initialization when configuration values are invalid.
 *
 * Examples: invalid basePath, cooldown out of range, invalid cron expression,
 * concurrency out of bounds, schedule interval below minimum.
 */
export class InvalidConfigError extends Error {
  public readonly name = 'InvalidConfigError';

  /**
   * @param message - Description of the invalid configuration
   */
  public constructor(message: string) {
    super(`Health module configuration error: ${message}`);
  }
}
