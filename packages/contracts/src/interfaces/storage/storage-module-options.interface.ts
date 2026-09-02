/**
 * @file storage-module-options.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description Root config shape for `StorageModule.forRoot(...)` /
 *   `StorageModule.forRootAsync(...)`.
 */

/**
 * Per-instance config bag.
 *
 * `driver` selects the backing store; every other field is
 * driver-specific and passed through to the corresponding
 * `IStorageDriverCreator` unmodified.
 */
export interface IStorageStoreConfig {
  /**
   * Driver name selecting the backing store.
   *
   * Cross-platform built-ins are `memory` (in-process) and `null`
   * (no-op sink for tests). Web-only drivers are `localStorage`,
   * `sessionStorage`, `indexedDB`, `cookie`. Native-only are
   * `asyncStorage` + `expoSecureStore`. Custom drivers register via
   * `manager.extend(name, creator)`.
   */
  readonly driver: string;

  /** Driver-specific option pass-through. */
  readonly [key: string]: unknown;
}

/**
 * Root options accepted by `StorageModule.forRoot(...)`.
 *
 * Two fields:
 * - `default` — the instance name resolved when `manager.instance()`
 *   is called with no argument (and the store bound to the
 *   `STORAGE` DI token).
 * - `stores` — every named instance the manager is expected to
 *   serve, keyed by name.
 *
 * Defaults live inline in the app-owned `registerAs` factory (see
 * `.kiro/steering/package-conventions.md` §Pattern A) via
 * `env('STORAGE_...', default)` calls — the package no longer ships
 * a `DEFAULT_STORAGE_CONFIG` fallback.
 */
export interface IStorageModuleOptions {
  /** Name of the default instance. Must be a key of `stores`. */
  readonly default?: string;

  /** Map of named instances to their configuration. */
  readonly stores?: Record<string, IStorageStoreConfig>;
}

/**
 * Fully-resolved storage config produced by an app-owned
 * `registerAs('storage', () => ({...}))` factory.
 *
 * @remarks Services inside `@stackra/storage` inject this shape via
 *   `STORAGE_CONFIG_INTERNAL` (package-private).
 */
export interface IStorageConfig {
  /** Resolved default instance name. */
  readonly default: string;
  /** Resolved named-instance map. */
  readonly stores: Record<string, IStorageStoreConfig>;
}
