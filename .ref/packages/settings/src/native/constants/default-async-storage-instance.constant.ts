/**
 * @file default-async-storage-instance.constant.ts
 * @module @stackra/settings/native/constants
 * @description Primitive default for the async-storage instance
 *   name the native settings store reads / writes through.
 *
 *   Kept as a single-primitive constant (per one-export-per-file)
 *   because it's a runtime-invariant slot name, not part of any
 *   aggregate config object.
 */

/**
 * Instance name in `@stackra/storage`'s IStorageManager registry
 * where the native settings store lives. Overridden via
 * `INativeSettingsModuleOptions.asyncStorageInstance`.
 */
export const DEFAULT_ASYNC_STORAGE_INSTANCE = "settings";
