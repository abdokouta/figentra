/**
 * @file config-validation.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown when config schema validation fails at boot time.
 */

import { ConfigError } from './config.error';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when config schema validation fails.
 *
 * Contains a list of all violations with their paths and messages.
 * Thrown during `onModuleInit` when a `validate` function or schema
 * rejects the loaded configuration.
 *
 * @example
 * ```typescript
 * try {
 *   await configManager.sourceAsync();
 * } catch (error: Error | any) {
 *   if (error instanceof ConfigValidationError) {
 *     for (const violation of error.violations) {
 *       console.error(`${violation.path}: ${violation.message}`);
 *     }
 *   }
 * }
 * ```
 */
export class ConfigValidationError extends ConfigError {
  /** Error name for identification. */
  public override readonly name: string = 'ConfigValidationError';

  /** Error code for programmatic handling. */
  public override readonly code: string = 'CONFIG_VALIDATION_ERROR';

  /** All validation violations. */
  public readonly violations: IConfigViolation[];

  /**
   * Create a new ConfigValidationError.
   *
   * @param violations - Array of validation violations
   * @param cause - Optional underlying error
   */
  public constructor(violations: IConfigViolation[], cause?: Error) {
    const paths = violations.map((v) => v.path).join(', ');
    super(`Config validation failed for ${violations.length} key(s): ${paths}`, cause);
    this.violations = violations;
  }
}
