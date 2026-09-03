/**
 * @file storage-manager.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the storage manager service.
 *   Binds `IStorageManager` — the workspace's canonical persistence abstraction.
 */

/** Injection token for `IStorageManager`. */
export const STORAGE_MANAGER: unique symbol = Symbol.for("STORAGE_MANAGER");
