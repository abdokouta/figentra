/**
 * @file hash-manager.service.ts
 * @module @stackra/ts-hashing/services
 * @description Hash manager service — orchestrates pluggable hashing drivers.
 *   Extends the base Manager class from `@stackra/ts-support` to provide
 *   lazy driver resolution, caching, and a fluent hashing API.
 */

import { IInjectable, Inject } from '@nestjs/common';
import { Manager } from '@stackra/ts-support';

import type { IHasher } from '@stackra/contracts';
import { HASHING_CONFIG } from '@stackra/contracts';

import type { IHashingModuleConfig } from '../interfaces';
import { BcryptHasher, Argon2Hasher, ScryptHasher } from '../drivers';

// ════════════════════════════════════════════════════════════════════════════════
// Service
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Hash manager — multi-driver hashing orchestrator.
 *
 * Extends the base `Manager<IHasher>` to provide password hashing with
 * pluggable drivers (bcrypt, argon2, scrypt). The active driver is determined
 * by the `default` key in the module configuration.
 *
 * Features:
 * - Lazy driver instantiation with caching
 * - Custom driver registration via `extend()`
 * - Convenience methods that delegate to the active driver
 * - Automatic driver creation via `create{Name}Driver()` convention
 *
 * @example
 * ```typescript
 * const manager = app.get(HashManager);
 * const hash = await manager.make('my-password');
 * const valid = await manager.check('my-password', hash);
 * const rehash = manager.needsRehash(hash);
 * ```
 */
@IInjectable()
export class HashManager extends Manager<IHasher> {
  /**
   * @param config - Hashing module configuration injected via DI
   */
  public constructor(@Inject(HASHING_CONFIG) private readonly config: IHashingModuleConfig) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Abstract Implementation
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Get the name of the default hashing driver from configuration.
   *
   * @returns The default driver name (e.g., 'bcrypt', 'argon2', 'scrypt')
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Convenience Methods
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Hash a plain-text value using the default driver.
   *
   * @param value - The plain-text value to hash
   * @param options - Driver-specific options (rounds, memory cost, etc.)
   * @returns The hashed value
   */
  public async make(value: string, options?: Record<string, unknown>): Promise<string> {
    return this.driver().make(value, options);
  }

  /**
   * Verify a plain-text value against a hash using the default driver.
   *
   * @param value - The plain-text value to check
   * @param hash - The hash to compare against
   * @returns `true` if the value matches the hash
   */
  public async check(value: string, hash: string): Promise<boolean> {
    return this.driver().check(value, hash);
  }

  /**
   * Determine if the given hash needs to be rehashed.
   *
   * @param hash - The hash to check
   * @returns `true` if the hash should be recomputed with current settings
   */
  public needsRehash(hash: string): boolean {
    return this.driver().needsRehash(hash);
  }

  /**
   * Get information about the given hash.
   *
   * @param hash - The hash to analyze
   * @returns Object containing algorithm info (algo, options)
   */
  public info(hash: string): Record<string, unknown> {
    return this.driver().info(hash);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Driver Creators
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a new BcryptHasher driver instance.
   *
   * @returns A configured BcryptHasher
   */
  protected createBcryptDriver(): IHasher {
    const driverConfig = this.config.drivers?.bcrypt ?? {};
    return new BcryptHasher(driverConfig);
  }

  /**
   * Create a new Argon2Hasher driver instance.
   *
   * @returns A configured Argon2Hasher
   */
  protected createArgon2Driver(): IHasher {
    const driverConfig = this.config.drivers?.argon2 ?? {};
    return new Argon2Hasher(driverConfig);
  }

  /**
   * Create a new ScryptHasher driver instance.
   *
   * @returns A configured ScryptHasher
   */
  protected createScryptDriver(): IHasher {
    const driverConfig = this.config.drivers?.scrypt ?? {};
    return new ScryptHasher(driverConfig);
  }
}
