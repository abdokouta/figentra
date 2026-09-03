/**
 * @file inject-encryption.decorator.ts
 * @module @stackra/nestjs-encryption/decorators
 * @description Convenience decorator for injecting the encryption service or a specific driver.
 *   Wraps `@Inject()` from `@nestjs/common` with encryption-specific token resolution.
 */

import { Inject } from '@nestjs/common';

import { ENCRYPTION_SERVICE } from '../constants';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Convenience decorator to inject the encryption service or a specific driver.
 *
 * When called without arguments, injects the default `EncryptionService` via
 * the `ENCRYPTION_SERVICE` token. When a driver name is specified, injects
 * a driver-specific token using a namespaced symbol.
 *
 * @param driver - Optional driver name ('aes-256-cbc', 'aes-256-gcm')
 * @returns Parameter decorator for constructor injection
 *
 * @example
 * ```typescript
 * // Inject the default encryption service
 * @InjectEncryption() encrypter: IEncryptionDriver
 *
 * // Inject a specific driver
 * @InjectEncryption('aes-256-gcm') gcm: IEncryptionDriver
 * ```
 */
export function InjectEncryption(driver?: string): ParameterDecorator {
  if (driver) {
    const token = Symbol.for(`ENCRYPTION_DRIVER_${driver}`);
    return Inject(token);
  }

  return Inject(ENCRYPTION_SERVICE);
}
