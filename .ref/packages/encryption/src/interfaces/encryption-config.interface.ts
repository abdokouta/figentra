/**
 * @file encryption-config.interface.ts
 * @module @stackra/nestjs-encryption/interfaces
 * @description Configuration interfaces for the encryption module.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Supported cipher algorithms for encryption.
 */
export type EncryptionCipher = 'aes-256-gcm' | 'aes-256-cbc';

/**
 * Configuration for the encryption module.
 *
 * @example
 * ```typescript
 * const config: IEncryptionConfig = {
 *   key: process.env.APP_KEY!,
 *   cipher: 'aes-256-gcm',
 *   previousKeys: ['old-key-1', 'old-key-2'],
 * };
 * ```
 */
export interface IEncryptionConfig {
  /** The primary encryption key (base64-encoded or raw string). */
  key: string;

  /** The cipher algorithm to use for encryption. */
  cipher: EncryptionCipher;

  /** Previous keys to try during decryption for key rotation support. */
  previousKeys: string[];
}

/**
 * Async module options for the encryption module.
 */
export interface IEncryptionModuleAsyncOptions {
  /** Factory function that produces the encryption configuration. */
  useFactory: (...args: any[]) => IEncryptionConfig | Promise<IEncryptionConfig>;

  /** DI tokens to inject into the factory function. */
  inject?: any[];
}
