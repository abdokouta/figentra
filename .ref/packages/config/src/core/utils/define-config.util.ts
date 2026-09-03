/**
 * @file define-config.util.ts
 * @module @stackra/config/core/utils
 * @description Configuration utility for type-safe config definition.
 *   Used in `.config.ts` files to define typed config objects with optional
 *   namespace (for DI injection) and schema validation.
 *
 *   When the FileDriver auto-discovers config files, it calls the default
 *   export. If the export was created by defineConfig, the type information
 *   is preserved end-to-end.
 */

import type { IConfigModuleOptions, IConfigFactory } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Global Pending Registry
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Global list of configs defined via `defineConfig(namespace, factory)`.
 *
 * When a config file is imported and `defineConfig('namespace', fn)` is called,
 * the factory is pushed here. `ConfigModule.forFeature()` or the FileDriver
 * can consume this list to auto-register all configs without manual `load: []`.
 */
const _pendingConfigs: IConfigFactory[] = [];

/**
 * Get all pending config factories registered via `defineConfig(namespace, fn)`.
 *
 * @returns Array of pending config factories
 */
export function getPendingConfigs(): IConfigFactory[] {
  return [..._pendingConfigs];
}

/**
 * Clear all pending config factories (for testing).
 */
export function clearPendingConfigs(): void {
  _pendingConfigs.length = 0;
}

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Schema type (supports Zod-like parse interface).
 */
interface IConfigSchema<T> {
  parse(data: unknown): T;
}

// ════════════════════════════════════════════════════════════════════════════════
// defineConfig — for config files
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Define a type-safe configuration object.
 *
 * Used in `.config.ts` files. The FileDriver auto-discovers these and
 * merges them by namespace (derived from file path).
 *
 * Overloads:
 * 1. `defineConfig(config)` — plain typed config object
 * 2. `defineConfig(factory)` — factory function returning config
 * 3. `defineConfig(schema, config)` — schema-validated config
 * 4. `defineConfig(namespace, factory)` — namespaced factory (also injectable via DI)
 * 5. `defineConfig(moduleOptions)` — ConfigModule options
 *
 * @example
 * ```typescript
 * // config/database.config.ts — simple object
 * export default defineConfig({
 *   host: env('DB_HOST', 'localhost'),
 *   port: Number(env('DB_PORT', '5432')),
 *   name: env('DB_NAME', 'app'),
 * });
 *
 * // config/cache.config.ts — with schema validation
 * const schema = z.object({ driver: z.string(), ttl: z.number() });
 * export default defineConfig(schema, { driver: 'memory', ttl: 300 });
 *
 * // config/mail.config.ts — namespaced (injectable via @Inject(KEY))
 * export const mailConfig = defineConfig('mail', () => ({
 *   host: env('MAIL_HOST', 'smtp.mailtrap.io'),
 *   port: Number(env('MAIL_PORT', '2525')),
 * }));
 * ```
 */
export function defineConfig(config: IConfigModuleOptions): IConfigModuleOptions;
export function defineConfig<T extends Record<string, unknown>>(config: T): T;
export function defineConfig<T extends Record<string, unknown>>(
  config: () => T | Promise<T>
): () => T | Promise<T>;
export function defineConfig<T extends Record<string, unknown>>(
  schema: IConfigSchema<T>,
  config: T
): T;
export function defineConfig<T extends Record<string, unknown>>(
  namespace: string,
  factory: () => T | Promise<T>
): IConfigFactory<T>;
export function defineConfig<T extends Record<string, unknown>>(...args: unknown[]): unknown {
  // Namespace + factory overload: defineConfig('mail', () => ({...}))
  if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'function') {
    const namespace = args[0] as string;
    const factory = args[1] as () => T | Promise<T>;
    const KEY = Symbol.for(`config:${namespace}`);

    const configFactory = factory as unknown as IConfigFactory<T>;
    Object.defineProperty(configFactory, 'KEY', { value: KEY, writable: false, enumerable: true });
    Object.defineProperty(configFactory, 'namespace', {
      value: namespace,
      writable: false,
      enumerable: true,
    });

    // Auto-register into the global pending config list.
    // ConfigModule.forFeature or forRoot will pick these up.
    _pendingConfigs.push(configFactory as unknown as IConfigFactory);

    return configFactory;
  }

  // Schema + config overload: defineConfig(zodSchema, { ... })
  if (args.length === 2 && typeof (args[0] as any)?.parse === 'function') {
    const schema = args[0] as IConfigSchema<T>;
    const config = args[1] as T;
    return schema.parse(config);
  }

  // Factory function overload: defineConfig(() => ({...}))
  if (args.length === 1 && typeof args[0] === 'function') {
    return args[0];
  }

  // Plain object overload: defineConfig({ ... })
  return args[0];
}
