/**
 * @file invalid-key.error.ts
 * @module @stackra/nestjs-encryption/errors
 * @description Specific error for invalid encryption key issues.
 *   Thrown when a key does not meet the requirements for the specified cipher.
 */

import { EncryptionError } from './encryption.error';

// ════════════════════════════════════════════════════════════════════════════════
// Error Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when an encryption key is invalid.
 *
 * Indicates that the provided key does not meet length or format
 * requirements for the configured cipher algorithm.
 *
 * @example
 * ```typescript
 * throw new InvalidKeyError('Key must be 32 bytes for AES-256-GCM.');
 * ```
 */
export class InvalidKeyError extends EncryptionError {
  /**
   * @param message - Human-readable description of the key validation failure
   */
  public constructor(message: string = 'Invalid encryption key.') {
    super(message);
    this.name = 'InvalidKeyError';
    Object.setPrototypeOf(this, InvalidKeyError.prototype);
  }
}
