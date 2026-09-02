/**
 * @file storage.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the unified KV storage system.
 */

/**
 * Configuration namespace for the storage subsystem.
 *
 * String constant used both as the `registerAs(STORAGE_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `StorageModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"storage"` and reach the same registration.
 */
export const STORAGE_CONFIG = "storage" as const;

/**
 * DI token for the resolved `IStorageManager`.
 *
 * @remarks Bound in `StorageModule.forRoot` / `.forRootAsync`.
 */
export const STORAGE_MANAGER = Symbol.for("STORAGE_MANAGER");

/**
 * DI token for the default `IStorage` instance — a shortcut equal to
 * `storageManager.instance()`.
 *
 * @remarks Bound in `StorageModule.forRoot` / `.forRootAsync`.
 */
export const STORAGE = Symbol.for("STORAGE");
