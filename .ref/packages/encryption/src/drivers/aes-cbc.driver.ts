/**
 * @file aes-cbc.driver.ts
 * @module @stackra/nestjs-encryption/drivers
 * @description AES-CBC encryption driver implementation.
 *   Uses Node.js `crypto` with HMAC-SHA256 for message authentication.
 *   Supports AES-128-CBC and AES-256-CBC with configurable key sizes.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { BaseEncryptionDriver } from './base.driver';
import { EncryptionError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * AES-CBC encryption driver.
 *
 * Implements AES encryption in CBC (Cipher Block Chaining) mode with
 * HMAC-SHA256 for message authentication. CBC does not provide built-in
 * integrity checking, so an HMAC is computed over the IV + ciphertext.
 *
 * Supports:
 * - AES-128-CBC (16-byte key)
 * - AES-256-CBC (32-byte key)
 *
 * @example
 * ```typescript
 * const driver = new AesCbcDriver(key, 'aes-256-cbc');
 * const encrypted = driver.encryptString('secret');
 * const decrypted = driver.decryptString(encrypted);
 * ```
 */
export class AesCbcDriver extends BaseEncryptionDriver {
  /** The derived encryption key buffer. */
  private readonly key: Buffer;

  /** The cipher algorithm identifier. */
  private readonly cipher: string;

  /** The raw key string for getKey(). */
  private readonly rawKey: string;

  /**
   * @param key - Base64-encoded or raw encryption key
   * @param cipher - The CBC cipher to use (default: 'aes-256-cbc')
   */
  public constructor(key: string, cipher: string = 'aes-256-cbc') {
    super();
    this.rawKey = key;
    this.cipher = cipher;
    this.key = this.resolveKey(key);
    this.validateKey();
  }

  /**
   * Encrypt a value with JSON serialization.
   *
   * @param value - The value to encrypt
   * @param serialize - Whether to JSON-serialize (default: true)
   * @returns Base64-encoded encrypted payload
   */
  public encrypt(value: unknown, serialize: boolean = true): string {
    const plaintext = serialize ? JSON.stringify(value) : String(value);
    return this.performEncrypt(plaintext);
  }

  /**
   * Decrypt a payload with JSON deserialization.
   *
   * @param payload - Base64-encoded encrypted payload
   * @param unserialize - Whether to JSON-parse (default: true)
   * @returns The decrypted value
   */
  public decrypt(payload: string, unserialize: boolean = true): unknown {
    const decrypted = this.performDecrypt(payload);

    if (unserialize) {
      try {
        return JSON.parse(decrypted);
      } catch {
        throw new EncryptionError('Failed to deserialize decrypted value.');
      }
    }

    return decrypted;
  }

  /**
   * Encrypt a raw string without serialization.
   *
   * @param value - The string to encrypt
   * @returns Base64-encoded encrypted payload
   */
  public encryptString(value: string): string {
    return this.performEncrypt(value);
  }

  /**
   * Decrypt a payload to a raw string.
   *
   * @param payload - Base64-encoded encrypted payload
   * @returns The decrypted string
   */
  public decryptString(payload: string): string {
    return this.performDecrypt(payload);
  }

  /**
   * Get the base64-encoded encryption key.
   *
   * @returns The raw key string
   */
  public getKey(): string {
    return this.rawKey;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Perform the actual CBC encryption.
   *
   * @param plaintext - The string to encrypt
   * @returns Base64-encoded payload
   */
  private performEncrypt(plaintext: string): string {
    const iv = randomBytes(16);

    try {
      const cipher = createCipheriv(this.cipher, this.key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);

      const value = encrypted.toString('base64');
      const mac = this.computeMac(iv, value);

      return this.createPayload(iv, value, mac, '');
    } catch (error: Error | any) {
      throw new EncryptionError(`AES-CBC encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Perform the actual CBC decryption with MAC verification.
   *
   * @param payload - Base64-encoded payload
   * @returns The decrypted string
   */
  private performDecrypt(payload: string): string {
    let parsed;
    try {
      parsed = this.parsePayload(payload);
    } catch {
      throw new EncryptionError('Invalid encrypted payload format.');
    }

    const iv = Buffer.from(parsed.iv, 'base64');
    const encrypted = Buffer.from(parsed.value, 'base64');

    // Verify MAC
    const computedMac = this.computeMac(iv, parsed.value);
    if (!this.verifyMac(parsed.mac, computedMac)) {
      throw new EncryptionError('MAC verification failed: payload may have been tampered with.');
    }

    try {
      const decipher = createDecipheriv(this.cipher, this.key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf-8');
    } catch (error: Error | any) {
      throw new EncryptionError(`AES-CBC decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Compute HMAC-SHA256 over the IV and ciphertext.
   *
   * @param iv - Initialization vector buffer
   * @param value - Base64-encoded ciphertext
   * @returns Hex-encoded HMAC string
   */
  private computeMac(iv: Buffer, value: string): string {
    const hmac = createHmac('sha256', this.key);
    hmac.update(iv.toString('base64'));
    hmac.update(value);
    return hmac.digest('hex');
  }

  /**
   * Verify a MAC using constant-time comparison.
   *
   * @param provided - The MAC from the payload
   * @param computed - The freshly computed MAC
   * @returns `true` if MACs match
   */
  private verifyMac(provided: string, computed: string): boolean {
    const bufA = Buffer.from(provided, 'hex');
    const bufB = Buffer.from(computed, 'hex');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }

  /**
   * Resolve the key from a string (base64 or raw).
   *
   * @param rawKey - The key string
   * @returns A Buffer of the appropriate length
   */
  private resolveKey(rawKey: string): Buffer {
    const decoded = Buffer.from(rawKey, 'base64');
    const expectedLength = this.cipher.includes('128') ? 16 : 32;

    if (decoded.length === expectedLength) {
      return decoded;
    }

    // If raw key length matches, use directly
    const raw = Buffer.from(rawKey, 'utf-8');
    if (raw.length === expectedLength) {
      return raw;
    }

    // Fall back to truncation/padding
    const key = Buffer.alloc(expectedLength);
    raw.copy(key, 0, 0, Math.min(raw.length, expectedLength));
    return key;
  }

  /**
   * Validate the key length against the cipher requirements.
   *
   * @throws {EncryptionError} When the key length is invalid
   */
  private validateKey(): void {
    const expectedLength = this.cipher.includes('128') ? 16 : 32;
    if (this.key.length !== expectedLength) {
      throw new EncryptionError(
        `Invalid key length for ${this.cipher}: expected ${expectedLength} bytes, got ${this.key.length}.`
      );
    }
  }
}
