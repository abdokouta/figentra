/**
 * @file config-encryption.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown when encryption/decryption operations fail
 *   due to a missing encryption key.
 */

import { ConfigError } from './config.error';

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when encrypted config values are encountered
 * but no encryption key is configured.
 *
 * @example
 * ```typescript
 * // This throws ConfigEncryptionError if no key is set:
 * const secret = config.get('database.password');
 * // Where the stored value is 'enc:abc123...'
 * ```
 */
export class ConfigEncryptionError extends ConfigError {
  /** Error name for identification. */
  public override readonly name: string = 'ConfigEncryptionError';

  /** Error code for programmatic handling. */
  public override readonly code: string = 'ENCRYPTION_KEY_MISSING';

  /**
   * Create a new ConfigEncryptionError.
   *
   * @param message - Human-readable error message
   * @param cause - Optional underlying error
   */
  public constructor(
    message: string = 'Encryption key not configured. Set encryptionKey in ConfigModuleOptions or CONFIG_ENCRYPTION_KEY environment variable.',
    cause?: Error
  ) {
    super(message, cause);
  }
}
