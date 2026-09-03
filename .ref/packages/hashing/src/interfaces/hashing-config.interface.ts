/**
 * @file hashing-config.interface.ts
 * @module @stackra/ts-hashing/interfaces
 * @description Internal configuration interfaces for the hashing module.
 *   These define the shape of `HashingModule.forRoot()` and `forRootAsync()` options.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Synchronous configuration for the hashing module.
 *
 * Specifies the default driver and per-driver options.
 *
 * @example
 * ```typescript
 * const config: IHashingModuleConfig = {
 *   default: 'bcrypt',
 *   drivers: {
 *     bcrypt: { rounds: 12 },
 *     argon2: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
 *     scrypt: { cost: 16384, blockSize: 8, parallelization: 1, keyLength: 64 },
 *   },
 * };
 * ```
 */
export interface IHashingModuleConfig {
  /** The name of the default hashing driver (e.g., 'bcrypt', 'argon2', 'scrypt'). */
  default: string;

  /** Per-driver configuration keyed by driver name. */
  drivers: Record<string, Record<string, unknown>>;
}

/**
 * Asynchronous configuration for the hashing module.
 *
 * Allows injecting dependencies to build the config at runtime.
 *
 * @example
 * ```typescript
 * HashingModule.forRootAsync({
 *   useFactory: (configService) => ({
 *     default: configService.get('HASH_DRIVER'),
 *     drivers: { bcrypt: { rounds: 14 } },
 *   }),
 *   inject: [ConfigService],
 * });
 * ```
 */
export interface IHashingModuleAsyncOptions {
  /** Factory function that produces the hashing configuration. */
  useFactory: (...args: any[]) => IHashingModuleConfig | Promise<IHashingModuleConfig>;

  /** DI tokens to inject into the factory function. */
  inject?: any[];
}
