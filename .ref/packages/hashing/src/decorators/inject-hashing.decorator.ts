/**
 * @file inject-hashing.decorator.ts
 * @module @stackra/ts-hashing/decorators
 * @description Convenience decorator for injecting the hashing service or a specific driver.
 *   Wraps `@Inject()` from `@stackra/ts-container` with hashing-specific token resolution.
 */

import { Inject } from '@nestjs/common';
import { HASH_MANAGER } from '@stackra/contracts';

import { HASHING_DRIVER_PREFIX } from '../constants';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Convenience decorator to inject the hashing service or a specific driver.
 *
 * When called without arguments, injects the default `HashManager` via
 * the `HASH_MANAGER` token. When a driver name is specified, injects
 * a driver-specific token using the `HASHING_DRIVER_PREFIX` namespace.
 *
 * @param driver - Optional driver name ('bcrypt', 'argon2', 'scrypt')
 * @returns Parameter decorator for constructor injection
 *
 * @example
 * ```typescript
 * // Inject the default hash manager
 * @InjectHashing() hasher: IHasher
 *
 * // Inject a specific driver
 * @InjectHashing('bcrypt') bcryptHasher: IHasher
 * ```
 */
export function InjectHashing(driver?: string): ParameterDecorator {
  if (driver) {
    const token = Symbol.for(`${HASHING_DRIVER_PREFIX}${driver}`);
    return Inject(token);
  }

  return Inject(HASH_MANAGER);
}
