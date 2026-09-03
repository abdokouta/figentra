/**
 * @file encryption-factory.service.ts
 * @module @stackra/nestjs-encryption/services
 * @description Factory service for creating encryption driver instances.
 *   Maintains a registry of available drivers and creates instances
 *   based on configuration. Supports key rotation via previousKeys.
 */

import { Inject, IInjectable } from '@nestjs/common';

import type { IEncryptionDriver } from '../interfaces';
import type { IEncryptionConfig } from '../interfaces';
import { AesCbcDriver, AesGcmDriver } from '../drivers';
import { InvalidKeyError } from '../errors';
import { ENCRYPTION_CONFIG } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Encryption driver factory.
 *
 * Creates driver instances based on the configured cipher algorithm.
 * Maintains a registry of available drivers and supports creating
 * fallback drivers for key rotation (decryption with previous keys).
 *
 * Features:
 * - Cipher-based driver resolution (CBC → AesCbcDriver, GCM → AesGcmDriver)
 * - Key validation before driver creation
 * - Previous key support for decryption fallback
 * - Custom driver registration via `register()`
 *
 * @example
 * ```typescript
 * const factory = app.get(EncryptionFactory);
 * const driver = factory.createDriver();
 * const encrypted = driver.encryptString('secret');
 * ```
 */
@IInjectable()
export class EncryptionFactory {
  /** Registry of custom driver factories keyed by cipher name. */
  private readonly registry = new Map<string, (key: string, cipher: string) => IEncryptionDriver>();

  /**
   * @param config - Encryption module configuration
   */
  public constructor(@Inject(ENCRYPTION_CONFIG) private readonly config: IEncryptionConfig) {}

  /**
   * Create the primary encryption driver from configuration.
   *
   * @returns A configured encryption driver for the primary key
   * @throws {InvalidKeyError} When the primary key is missing or empty
   */
  public createDriver(): IEncryptionDriver {
    if (!this.config.key) {
      throw new InvalidKeyError('No encryption key configured.');
    }

    return this.createDriverForCipher(this.config.key, this.config.cipher);
  }

  /**
   * Create fallback drivers for previous keys (key rotation support).
   *
   * Returns an array of drivers configured with each previous key,
   * used for decryption fallback when the primary key fails.
   *
   * @returns Array of encryption drivers for previous keys
   */
  public createPreviousKeyDrivers(): IEncryptionDriver[] {
    const drivers: IEncryptionDriver[] = [];

    for (const key of this.config.previousKeys ?? []) {
      if (key) {
        try {
          drivers.push(this.createDriverForCipher(key, this.config.cipher));
        } catch {
          // Skip invalid previous keys silently
        }
      }
    }

    return drivers;
  }

  /**
   * Register a custom driver factory for a specific cipher name.
   *
   * @param cipher - The cipher identifier to register
   * @param factory - Factory function that creates the driver
   */
  public register(
    cipher: string,
    factory: (key: string, cipher: string) => IEncryptionDriver
  ): void {
    this.registry.set(cipher, factory);
  }

  /**
   * Create a driver instance for the specified cipher and key.
   *
   * @param key - The encryption key
   * @param cipher - The cipher algorithm identifier
   * @returns A configured encryption driver
   * @throws {InvalidKeyError} When the cipher is not supported
   */
  public createDriverForCipher(key: string, cipher: string): IEncryptionDriver {
    // Check custom registry first
    const customFactory = this.registry.get(cipher);
    if (customFactory) {
      return customFactory(key, cipher);
    }

    // Built-in drivers
    if (cipher.includes('gcm')) {
      return new AesGcmDriver(key, cipher);
    }

    if (cipher.includes('cbc')) {
      return new AesCbcDriver(key, cipher);
    }

    throw new InvalidKeyError(`Unsupported cipher algorithm: ${cipher}.`);
  }
}
