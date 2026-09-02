/**
 * @file storage.interface.ts
 * @module @stackra/contracts/interfaces/storage
 * @description The `IStorage` KV contract — one shape every backing
 *   store (localStorage, sessionStorage, IndexedDB, AsyncStorage,
 *   memory) speaks.
 */

/**
 * Options passed to `IStorage.set()`.
 *
 * The family sits alongside `IStorage` because it is only ever
 * consumed by that interface's `set` method.
 */
export interface IStorageSetOptions {
  /**
   * Time-to-live in seconds. When omitted the entry never expires.
   *
   * @remarks Drivers that don't natively support TTL (localStorage,
   *   sessionStorage, AsyncStorage) wrap the value in an envelope
   *   `{ v, e? }` and expire it on read. IndexedDB stores the
   *   expiry alongside the value in the row.
   */
  readonly ttlSeconds?: number;
}

/**
 * Async KV storage contract.
 *
 * Promise-first for uniformity: sync backing stores (localStorage,
 * sessionStorage) wrap results in `Promise.resolve(...)`; async
 * ones (IndexedDB, AsyncStorage) return real promises. Consumers
 * never branch on backing store.
 *
 * Missing entries and expired entries both resolve to `null`
 * (matching `AsyncStorage.getItem`'s convention).
 *
 * @example
 * ```typescript
 * import { STORAGE, type IStorage } from '@stackra/contracts';
 *
 * class PreferencesService {
 *   public constructor(@Inject(STORAGE) private readonly storage: IStorage) {}
 *
 *   async loadTheme(): Promise<string> {
 *     return (await this.storage.get<string>('theme')) ?? 'light';
 *   }
 * }
 * ```
 */
export interface IStorage {
  /**
   * Read a value by key.
   *
   * @typeParam T - Expected value type after deserialisation.
   * @param key - The key to read.
   * @returns The stored value, or `null` when the key is missing or
   *   the entry has expired.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Write a value.
   *
   * @typeParam T - The value type. Must be JSON-serialisable when the
   *   backing store serialises (localStorage, sessionStorage,
   *   AsyncStorage). Structured-clonable when the store uses
   *   structured clone (IndexedDB).
   * @param key - The key to write.
   * @param value - The value to persist.
   * @param options - Optional set options (`ttlSeconds`, …).
   */
  set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void>;

  /**
   * Delete a key.
   *
   * @param key - The key to remove. No-op when the key is absent.
   */
  delete(key: string): Promise<void>;

  /**
   * Remove every key owned by this instance.
   *
   * @remarks Only touches keys under this instance's prefix — other
   *   named `IStorage` instances sharing the same physical backing
   *   store are unaffected.
   */
  clear(): Promise<void>;

  /**
   * Whether a key exists (and is not expired).
   *
   * @param key - The key to check.
   * @returns `true` when the key exists AND has not expired.
   */
  has(key: string): Promise<boolean>;

  /**
   * List every key owned by this instance.
   *
   * @returns Every non-expired key currently persisted under this
   *   instance's prefix. Order is store-defined.
   */
  keys(): Promise<string[]>;

  /**
   * Subscribe to key changes on this storage instance. Optional —
   * drivers that cannot emit change signals (e.g. `AsyncStorage`
   * where changes are process-local, or `CookieStore` where
   * `document.cookie` writes don't fire events) may omit the
   * method or implement it as a no-op returning a `() => void`.
   *
   * ## Semantics
   *
   * - **`LocalStorageStore`** — routes `window.addEventListener("storage",
   *   ...)` filtered to keys under this instance's prefix. The `storage`
   *   event fires in PEER tabs (never the writer) — this is the
   *   canonical cross-tab signal.
   * - **`SessionStorageStore`** — routes the same `storage` event, but
   *   `sessionStorage` is per-window so cross-tab semantics don't apply;
   *   the subscription fires only when a peer WINDOW (rare) writes.
   * - **`IndexedDbStore`** — layers `BroadcastChannel("stackra-idb-<db>")`
   *   on top of Dexie writes.
   * - **`MemoryStore`, `MockStorage`, `NullStore`** — synchronous
   *   in-process notifier (all listeners fired on every mutation of
   *   this instance).
   * - **`AsyncStorageStore` (RN), `CookieStore`** — no reliable
   *   cross-instance signal; implement as `() => () => {}` no-op OR
   *   omit entirely. Consumers relying on cross-instance change signals
   *   must layer `@stackra/state`'s `CrossTabBroadcaster` on top of
   *   these drivers.
   *
   * ## When to call
   *
   * The primary consumer is `@stackra/state`'s
   * `PersistenceBroadcaster` — hydrating a store from a peer tab's
   * write. Feature-package services should route persistence through
   * `StateModule.forFeature(...)` and let the broadcaster subscribe
   * for them; direct use of `IStorage.subscribe()` from feature code
   * is legitimate but rare.
   *
   * @param callback - Invoked with `(key, value)` on every change
   *   this driver can observe. `value` is the parsed JSON payload
   *   OR `null` when the entry was deleted / cleared. `key` is the
   *   USER-VISIBLE key (prefix already stripped).
   * @returns An unsubscribe function.
   *
   * @example
   * ```typescript
   * const storage = manager.instance("theming");
   * if (typeof storage.subscribe === "function") {
   *   const off = storage.subscribe((key, value) => {
   *     if (key === "theme-mode") applyMode(value as ColorMode);
   *   });
   *   // Later: off();
   * }
   * ```
   */
  subscribe?(callback: (key: string, value: unknown) => void): () => void;
}
