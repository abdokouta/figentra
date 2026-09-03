/**
 * @file encryption-driver.interface.ts
 * @module @stackra/nestjs-encryption/interfaces
 * @description Contract for encryption driver implementations.
 *   Defines the API that both AES-CBC and AES-GCM drivers must satisfy.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interface
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Encryption driver contract.
 *
 * Drivers provide encrypt/decrypt operations for both serialized values
 * (JSON) and raw strings. Each driver handles a specific cipher algorithm
 * (e.g., AES-256-CBC, AES-256-GCM).
 */
export interface IEncryptionDriver {
  /**
   * Encrypt a value with optional JSON serialization.
   *
   * @param value - The value to encrypt (serialized to JSON if serialize is true)
   * @param serialize - Whether to JSON-serialize the value before encryption
   * @returns Base64-encoded encrypted payload string
   */
  encrypt(value: unknown, serialize?: boolean): string;

  /**
   * Decrypt a payload with optional JSON deserialization.
   *
   * @param payload - Base64-encoded encrypted payload string
   * @param unserialize - Whether to JSON-parse the decrypted value
   * @returns The decrypted value
   */
  decrypt(payload: string, unserialize?: boolean): unknown;

  /**
   * Encrypt a raw string value without serialization.
   *
   * @param value - The string to encrypt
   * @returns Base64-encoded encrypted payload string
   */
  encryptString(value: string): string;

  /**
   * Decrypt a payload to a raw string without deserialization.
   *
   * @param payload - Base64-encoded encrypted payload string
   * @returns The decrypted string
   */
  decryptString(payload: string): string;

  /**
   * Get the base64-encoded encryption key.
   *
   * @returns The key string used by this driver
   */
  getKey(): string;
}
