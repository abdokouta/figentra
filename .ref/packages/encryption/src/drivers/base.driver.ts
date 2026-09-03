/**
 * @file base.driver.ts
 * @module @stackra/nestjs-encryption/drivers
 * @description Abstract base class for encryption drivers.
 *   Provides shared payload serialization/deserialization logic
 *   that concrete AES-CBC and AES-GCM drivers inherit.
 */

import type { IEncryptionDriver } from '../interfaces';
import type { IEncryptedPayload } from '../types';

// ════════════════════════════════════════════════════════════════════════════════
// Abstract Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Abstract base class for encryption drivers.
 *
 * Provides shared payload encoding/decoding logic. Concrete drivers
 * implement the actual crypto operations (cipher creation, auth tag handling).
 *
 * Payload format: base64(JSON({ iv, value, mac, tag }))
 */
export abstract class BaseEncryptionDriver implements IEncryptionDriver {
  // ══════════════════════════════════════════════════════════════════════════════
  // Abstract Methods
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Encrypt a value with optional JSON serialization.
   *
   * @param value - The value to encrypt
   * @param serialize - Whether to JSON-serialize first (default: true)
   * @returns Base64-encoded encrypted payload
   */
  public abstract encrypt(value: unknown, serialize?: boolean): string;

  /**
   * Decrypt a payload with optional JSON deserialization.
   *
   * @param payload - Base64-encoded encrypted payload
   * @param unserialize - Whether to JSON-parse after decryption (default: true)
   * @returns The decrypted value
   */
  public abstract decrypt(payload: string, unserialize?: boolean): unknown;

  /**
   * Encrypt a raw string without serialization.
   *
   * @param value - The string to encrypt
   * @returns Base64-encoded encrypted payload
   */
  public abstract encryptString(value: string): string;

  /**
   * Decrypt a payload to a raw string without deserialization.
   *
   * @param payload - Base64-encoded encrypted payload
   * @returns The decrypted string
   */
  public abstract decryptString(payload: string): string;

  /**
   * Get the base64-encoded encryption key.
   *
   * @returns The key string used by this driver
   */
  public abstract getKey(): string;

  // ══════════════════════════════════════════════════════════════════════════════
  // Protected Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a base64-encoded payload string from encrypted components.
   *
   * @param iv - Initialization vector buffer
   * @param value - Base64-encoded encrypted data
   * @param mac - Base64-encoded HMAC (empty string for GCM)
   * @param tag - Base64-encoded auth tag (empty string for CBC)
   * @returns Base64-encoded JSON payload string
   */
  protected createPayload(iv: Buffer, value: string, mac: string, tag: string): string {
    const payload: IEncryptedPayload = {
      iv: iv.toString('base64'),
      value,
      mac,
      tag,
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Parse a base64-encoded payload string into its components.
   *
   * @param payload - Base64-encoded JSON payload string
   * @returns Parsed encrypted payload components
   * @throws {Error} When the payload format is invalid
   */
  protected parsePayload(payload: string): IEncryptedPayload {
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as IEncryptedPayload;

    if (!parsed.iv || !parsed.value) {
      throw new Error('Invalid encrypted payload: missing iv or value.');
    }

    return {
      iv: parsed.iv,
      value: parsed.value,
      mac: parsed.mac ?? '',
      tag: parsed.tag ?? '',
    };
  }
}
