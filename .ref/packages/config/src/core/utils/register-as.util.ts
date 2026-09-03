/**
 * @file register-as.util.ts
 * @module @stackra/config/core/utils
 * @description Creates namespaced config factories for DI injection.
 *   Follows the same pattern as NestJS ConfigModule.registerAs.
 */

import type { IConfigFactory } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Create a namespaced config factory for DI injection.
 *
 * Returns a callable `ConfigFactory` tagged with a `KEY` symbol and
 * `namespace` string. When passed to `ConfigModule.forRoot({ load: [...] })`,
 * the factory's result is merged into the default source under the
 * namespace key, and a DI provider is registered at `factory.KEY`.
 *
 * Consumers inject the namespaced config via `@Inject(factory.KEY)`.
 *
 * @typeParam T - The config shape returned by the factory
 * @param namespace - The namespace key (e.g., 'database', 'mail', 'redis')
 * @param factory - A function returning the config object (sync or async)
 * @returns A ConfigFactory function with KEY and namespace properties
 *
 * @example
 * ```typescript
 * // config/database.config.ts
 * export const databaseConfig = registerAs('database', () => ({
 *   host: env('DB_HOST', 'localhost'),
 *   port: Number(env('DB_PORT', '5432')),
 *   name: env('DB_NAME', 'app'),
 * }));
 *
 * // app.module.ts
 * ConfigModule.forRoot({
 *   default: 'env',
 *   sources: { env: { driver: 'env' } },
 *   load: [databaseConfig],
 * })
 *
 * // database.service.ts
 * @Injectable()
 * class DatabaseService {
 *   constructor(@Inject(databaseConfig.KEY) private dbConfig: { host: string; port: number; name: string }) {}
 * }
 * ```
 */
export function registerAs<T extends Record<string, unknown>>(
  namespace: string,
  factory: () => T | Promise<T>
): IConfigFactory<T> {
  const KEY = Symbol.for(`config:${namespace}`);

  const configFactory = factory as unknown as IConfigFactory<T>;
  Object.defineProperty(configFactory, 'KEY', { value: KEY, writable: false, enumerable: true });
  Object.defineProperty(configFactory, 'namespace', {
    value: namespace,
    writable: false,
    enumerable: true,
  });

  return configFactory;
}
