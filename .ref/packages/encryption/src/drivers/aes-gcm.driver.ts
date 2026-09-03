/**
 * @file aes-gcm.driver.ts
 * @module @stackra/nestjs-encryption/drivers
 * @description AES-GCM encryption driver implementation.
 *   Uses Node.js `crypto` with authenticated encryption (AEAD).
 *   The auth tag provides integrity checking without a separate HMAC.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';

import { BaseEncryptionDriver } from './base.driver';
import { EncryptionError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** GCM standard IV length (96 bits). */
const GCM_IV_LENGTH = 12;

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * AES-GCM encryption driver.
 *
 * Implements AES encryption in GCM (Galois/Counter Mode) — an authenticated
 * encryption with associated data (AEAD) cipher. GCM provides both
 * confidentiality and integrity in a single operation via the auth tag.
 *
 * Supports:
 * - AES-128-GCM (16-byte key, 12-byte IV)
 * - AES-256-GCM (32-byte key, 12-byte IV)
 *
 * @example
 * ```typescript
 * const driver = new AesGcmDriver(key, 'aes-256-gcm');
 * const encrypted = driver.encryptString('secret');
 * const decrypted = driver.decryptString(encrypted);
 * ```
 */
export class AesGcmDriver extends BaseEncryptionDriver {
  /** The derived encryption key buffer. */
  private readonly key: Buffer;

  /** The cipher algorithm identifier. */
  private readonly cipher: string;

  /** The raw key string for getKey(). */
  private readonly rawKey: string;

  /**
   * @param key - Base64-encoded or raw encryption key
   * @param cipher - The GCM cipher to use (default: 'aes-256-gcm')
   */
  public constructor(key: string, cipher: string = 'aes-256-gcm') {
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
   * Perform the actual GCM encryption.
   *
   * @param plaintext - The string to encrypt
   * @returns Base64-encoded payload with auth tag
   */
  private performEncrypt(plaintext: string): string {
    const iv = randomBytes(GCM_IV_LENGTH);

    try {
      const cipher = createCipheriv(this.cipher, this.key, iv) as CipherGCM;

      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);

      const tag = cipher.getAuthTag();
      const value = encrypted.toString('base64');

      return this.createPayload(iv, value, '', tag.toString('base64'));
    } catch (error: Error | any) {
      throw new EncryptionError(`AES-GCM encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Perform the actual GCM decryption with auth tag verification.
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

    if (!parsed.tag) {
      throw new EncryptionError('GCM payload missing authentication tag.');
    }

    const iv = Buffer.from(parsed.iv, 'base64');
    const encrypted = Buffer.from(parsed.value, 'base64');
    const tag = Buffer.from(parsed.tag, 'base64');

    try {
      const decipher = createDecipheriv(this.cipher, this.key, iv) as DecipherGCM;
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf-8');
    } catch (error: Error | any) {
      throw new EncryptionError(
        `AES-GCM decryption failed: authentication tag mismatch or corrupted data.`
      );
    }
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

    const raw = Buffer.from(rawKey, 'utf-8');
    if (raw.length === expectedLength) {
      return raw;
    }

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
