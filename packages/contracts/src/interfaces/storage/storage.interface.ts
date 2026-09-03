/**
 * @file storage.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description Contract for a single storage instance. Every driver
 *   (localStorage, IndexedDB, AsyncStorage, memory, cookie, null) satisfies
 *   this shape. Injected via `STORAGE_MANAGER` → `.instance(name)`.
 */

/**
 * A single key-value storage instance.
 */
export interface IStorage {
  /** Retrieve a value by key. Returns `null` when absent. */
  get<T = unknown>(key: string): Promise<T | null>;

  /** Set a value under a key. */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /** Remove a key. No-ops when absent. */
  remove(key: string): Promise<void>;

  /** Remove every key. */
  clear(): Promise<void>;

  /** Test whether a key exists. */
  has(key: string): Promise<boolean>;

  /** Return every key currently stored. */
  keys(): Promise<string[]>;

  /** Return the number of stored entries. */
  size(): Promise<number>;
}

/**
 * Storage manager contract — injected via `STORAGE_MANAGER`.
 * Returns named `IStorage` instances configured at boot time.
 */
export interface IStorageManager {
  /**
   * Return a named storage instance.
   *
   * @param name - Instance name (e.g. "localStorage", "sessionStorage", "memory").
   * @returns The storage instance.
   */
  instance(name: string): IStorage;
}
