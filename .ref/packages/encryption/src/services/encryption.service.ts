/**
 * @file encryption.service.ts
 * @module @stackra/nestjs-encryption/services
 * @description AES-256 encryption service with GCM/CBC support and key rotation.
 *   Provides encrypt/decrypt operations for both serialized values and raw strings.
 *   Supports previous key fallback for seamless key rotation.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

import { Inject, IInjectable } from '@nestjs/common';

import type { IEncryptionConfig, EncryptionCipher } from '../interfaces';
import { EncryptionError } from '../errors';
import { ENCRYPTION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

interface IEncryptedPayload {
  /** Base64-encoded initialization vector. */
  iv: string;
  /** Base64-encoded encrypted value. */
  value: string;
  /** Base64-encoded authentication tag (GCM only). */
  tag?: string;
  /** Cipher used for encryption. */
  cipher: EncryptionCipher;
}

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Encryption service — AES-256-GCM and AES-256-CBC encryption with key rotation.
 *
 * Provides a high-level API for encrypting and decrypting values using
 * industry-standard AES-256 encryption. Supports key rotation by attempting
 * decryption with previous keys when the primary key fails.
 *
 * Features:
 * - AES-256-GCM (authenticated encryption, recommended)
 * - AES-256-CBC (compatibility mode)
 * - Key rotation via `previousKeys` configuration
 * - JSON serialization for complex values
 * - Raw string encryption for simple values
 * - Cryptographically secure key generation
 *
 * @example
 * ```typescript
 * const service = app.get(EncryptionService);
 *
 * // Encrypt a value (JSON-serialized)
 * const encrypted = service.encrypt({ userId: 123, role: 'admin' });
 *
 * // Decrypt back to original value
 * const decrypted = service.decrypt(encrypted);
 * // => { userId: 123, role: 'admin' }
 *
 * // String-only encryption (no serialization)
 * const token = service.encryptString('my-secret-token');
 * const original = service.decryptString(token);
 * ```
 */
@IInjectable()
export class EncryptionService {
  /** The derived 32-byte encryption key. */
  private readonly key: Buffer;

  /** The cipher algorithm to use. */
  private readonly cipher: EncryptionCipher;

  /** Previous keys for decryption fallback (key rotation). */
  private readonly previousKeys: Buffer[];

  /**
   * @param config - Encryption module configuration injected via DI
   */
  public constructor(@Inject(ENCRYPTION_CONFIG) config: IEncryptionConfig) {
    this.key = this.deriveKey(config.key);
    this.cipher = config.cipher;
    this.previousKeys = (config.previousKeys ?? []).map((k) => this.deriveKey(k));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Encrypt a value with JSON serialization.
   *
   * Serializes the value to JSON, then encrypts it. Returns a base64-encoded
   * string containing the IV, encrypted data, and authentication tag.
   *
   * @param value - Any JSON-serializable value to encrypt
   * @returns Base64-encoded encrypted payload string
   * @throws {EncryptionError} When encryption fails
   *
   * @example
   * ```typescript
   * const encrypted = service.encrypt({ userId: 123 });
   * ```
   */
  public encrypt(value: unknown): string {
    const serialized = JSON.stringify(value);
    return this.encryptRaw(serialized);
  }

  /**
   * Decrypt a payload back to its original value.
   *
   * Decodes the base64 payload, decrypts it, and deserializes the JSON.
   * Attempts the primary key first, then falls back to previous keys.
   *
   * @param payload - Base64-encoded encrypted payload string
   * @returns The decrypted and deserialized value
   * @throws {EncryptionError} When decryption fails with all keys
   *
   * @example
   * ```typescript
   * const value = service.decrypt(encrypted);
   * ```
   */
  public decrypt(payload: string): unknown {
    const decrypted = this.decryptRaw(payload);

    try {
      return JSON.parse(decrypted);
    } catch {
      throw new EncryptionError('Failed to deserialize decrypted value.');
    }
  }

  /**
   * Encrypt a string value without JSON serialization.
   *
   * Use this for simple string values where JSON overhead is unnecessary.
   *
   * @param value - The string to encrypt
   * @returns Base64-encoded encrypted payload string
   * @throws {EncryptionError} When encryption fails
   *
   * @example
   * ```typescript
   * const token = service.encryptString('my-api-token');
   * ```
   */
  public encryptString(value: string): string {
    return this.encryptRaw(value);
  }

  /**
   * Decrypt a payload back to a raw string (no deserialization).
   *
   * @param payload - Base64-encoded encrypted payload string
   * @returns The decrypted string
   * @throws {EncryptionError} When decryption fails with all keys
   *
   * @example
   * ```typescript
   * const original = service.decryptString(token);
   * ```
   */
  public decryptString(payload: string): string {
    return this.decryptRaw(payload);
  }

  /**
   * Generate a cryptographically secure random key.
   *
   * @param cipher - The cipher to generate a key for (determines key length)
   * @returns A random key Buffer suitable for the specified cipher
   *
   * @example
   * ```typescript
   * const newKey = service.generateKey('aes-256-gcm');
   * const base64Key = newKey.toString('base64');
   * ```
   */
  public generateKey(cipher?: EncryptionCipher): Buffer {
    const _cipher = cipher ?? this.cipher;
    const keyLength = _cipher.includes('256') ? 32 : 16;
    return randomBytes(keyLength);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Encrypt a raw string value.
   *
   * @param value - The string to encrypt
   * @returns Base64-encoded JSON payload
   */
  private encryptRaw(value: string): string {
    const iv = randomBytes(this.getIvLength());

    try {
      if (this.cipher === 'aes-256-gcm') {
        return this.encryptGcm(value, iv);
      }
      return this.encryptCbc(value, iv);
    } catch (error: Error | any) {
      throw new EncryptionError(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt a raw payload string, trying all available keys.
   *
   * @param payload - Base64-encoded JSON payload
   * @returns The decrypted string
   */
  private decryptRaw(payload: string): string {
    let parsed: IEncryptedPayload;

    try {
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      parsed = JSON.parse(decoded) as IEncryptedPayload;
    } catch {
      throw new EncryptionError('Invalid encrypted payload format.');
    }

    // Try primary key first
    const primaryResult = this.tryDecrypt(parsed, this.key);
    if (primaryResult !== null) {
      return primaryResult;
    }

    // Try previous keys for key rotation
    for (const prevKey of this.previousKeys) {
      const result = this.tryDecrypt(parsed, prevKey);
      if (result !== null) {
        return result;
      }
    }

    throw new EncryptionError('Decryption failed: unable to decrypt with any available key.');
  }

  /**
   * Attempt decryption with a specific key.
   *
   * @param parsed - The parsed encrypted payload
   * @param key - The key to attempt decryption with
   * @returns The decrypted string or null if decryption failed
   */
  private tryDecrypt(parsed: IEncryptedPayload, key: Buffer): string | null {
    try {
      const cipher = parsed.cipher ?? this.cipher;

      if (cipher === 'aes-256-gcm') {
        return this.decryptGcm(parsed, key);
      }
      return this.decryptCbc(parsed, key);
    } catch {
      return null;
    }
  }

  /**
   * Encrypt using AES-256-GCM (authenticated encryption).
   *
   * @param value - Plain text to encrypt
   * @param iv - Initialization vector
   * @returns Base64-encoded payload
   */
  private encryptGcm(value: string, iv: Buffer): string {
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payload: IEncryptedPayload = {
      iv: iv.toString('base64'),
      value: encrypted.toString('base64'),
      tag: tag.toString('base64'),
      cipher: 'aes-256-gcm',
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Decrypt using AES-256-GCM.
   *
   * @param parsed - Parsed encrypted payload
   * @param key - Decryption key
   * @returns Decrypted string
   */
  private decryptGcm(parsed: IEncryptedPayload, key: Buffer): string {
    if (!parsed.tag) {
      throw new EncryptionError('GCM payload missing authentication tag.');
    }

    const iv = Buffer.from(parsed.iv, 'base64');
    const encrypted = Buffer.from(parsed.value, 'base64');
    const tag = Buffer.from(parsed.tag, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf-8');
  }

  /**
   * Encrypt using AES-256-CBC.
   *
   * @param value - Plain text to encrypt
   * @param iv - Initialization vector
   * @returns Base64-encoded payload
   */
  private encryptCbc(value: string, iv: Buffer): string {
    const cipher = createCipheriv('aes-256-cbc', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()]);

    const payload: IEncryptedPayload = {
      iv: iv.toString('base64'),
      value: encrypted.toString('base64'),
      cipher: 'aes-256-cbc',
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Decrypt using AES-256-CBC.
   *
   * @param parsed - Parsed encrypted payload
   * @param key - Decryption key
   * @returns Decrypted string
   */
  private decryptCbc(parsed: IEncryptedPayload, key: Buffer): string {
    const iv = Buffer.from(parsed.iv, 'base64');
    const encrypted = Buffer.from(parsed.value, 'base64');

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf-8');
  }

  /**
   * Derive a 32-byte key from a string (supports base64 or raw).
   *
   * @param rawKey - The raw key string
   * @returns A 32-byte Buffer suitable for AES-256
   */
  private deriveKey(rawKey: string): Buffer {
    // Try base64 first
    const decoded = Buffer.from(rawKey, 'base64');
    if (decoded.length === 32) {
      return decoded;
    }

    // Fall back to SHA-256 hash of the key
    return createHash('sha256').update(rawKey).digest();
  }

  /**
   * Get the IV length for the configured cipher.
   *
   * @returns IV length in bytes
   */
  private getIvLength(): number {
    return this.cipher === 'aes-256-gcm' ? 12 : 16;
  }
}
