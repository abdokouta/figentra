/**
 * @file native-async-storage-settings-store.spec.ts
 * @description Unit tests for {@link AsyncStorageSettingsStore}.
 *
 *   The native store subclasses {@link StorageSettingsStore} —
 *   these tests verify:
 *   - It resolves the AsyncStorage-named instance from the injected
 *     `IStorageManager` (never touches
 *     `@react-native-async-storage/async-storage` directly).
 *   - It honours the settings config `prefix`.
 *   - Round-trip via `load` / `save` / `clear` works through the
 *     fake `IStorage`.
 */

import { describe, it, expect } from "vitest";
import type { ISettingsConfig, IStorage, IStorageManager } from "@stackra/contracts";

import { AsyncStorageSettingsStore } from "../../src/native/stores/async-storage-settings.store";

/**
 * Build a fake `IStorage` — a naive Map-backed store — plus a
 * matching `IStorageManager` that only resolves one instance name.
 * Any other name throws so tests catch accidental instance lookups.
 */
function createFakeStorageBackend(): {
  manager: IStorageManager;
  backing: Map<string, unknown>;
  lookups: string[];
} {
  const backing = new Map<string, unknown>();
  const lookups: string[] = [];

  const storage: IStorage = {
    async get<T>(key: string): Promise<T | null> {
      return backing.has(key) ? (backing.get(key) as T) : null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      backing.set(key, value);
    },
    async delete(key: string): Promise<void> {
      backing.delete(key);
    },
    async clear(): Promise<void> {
      backing.clear();
    },
    async has(key: string): Promise<boolean> {
      return backing.has(key);
    },
    async keys(): Promise<string[]> {
      return Array.from(backing.keys());
    },
  };

  const manager: IStorageManager = {
    instance(name?: string): IStorage {
      const resolved = name ?? "asyncStorage";
      lookups.push(resolved);
      if (resolved !== "asyncStorage") {
        throw new Error(`Unexpected instance lookup: ${resolved}`);
      }
      return storage;
    },
    hasInstance(): boolean {
      return true;
    },
    extend(): IStorageManager {
      return this;
    },
    getDefaultInstance(): string {
      return "asyncStorage";
    },
  };

  return { manager, backing, lookups };
}

/**
 * Minimal `ISettingsConfig` stub matching the shape
 * `mergeConfig` emits. Only the fields the store reads are
 * populated — everything else is left as-is.
 */
function createSettingsConfigStub(prefix = "stackra:settings"): ISettingsConfig {
  return {
    default: "asyncStorage",
    stores: { asyncStorage: { driver: "storage", storageInstance: "asyncStorage" } },
    prefix,
    debounce: false,
    debounceMs: 0,
    api: {
      httpClient: "default",
      endpoints: {
        schema: "/api/v1/settings/schema",
        listGroups: "/api/v1/settings",
        getGroup: "/api/v1/settings/{group}",
        updateGroup: "/api/v1/settings/{group}",
      },
      autoLoadSchema: false,
      autoLoadValues: false,
      cacheSchemaStore: false,
    },
    broadcasting: {
      enabled: false,
      channelPrefix: "settings",
      connection: "default",
    },
  };
}

describe("AsyncStorageSettingsStore", () => {
  it("resolves the AsyncStorage instance via IStorageManager", () => {
    const { manager, lookups } = createFakeStorageBackend();
    const config = createSettingsConfigStub();
    // Constructor triggers the instance() call inside StorageSettingsStore.
    new AsyncStorageSettingsStore(manager, config);
    expect(lookups).toContain("asyncStorage");
  });

  it("round-trips values through the underlying IStorage with the configured prefix", async () => {
    const { manager, backing } = createFakeStorageBackend();
    const config = createSettingsConfigStub("stackra:settings");
    const store = new AsyncStorageSettingsStore(manager, config);

    await store.save("display", { theme: "dark" });
    expect(backing.get("stackra:settings:display")).toEqual({ theme: "dark" });

    const values = await store.load("display");
    expect(values).toEqual({ theme: "dark" });

    await store.clear("display");
    expect(backing.has("stackra:settings:display")).toBe(false);
  });

  it("loadAll returns every persisted group under the prefix", async () => {
    const { manager } = createFakeStorageBackend();
    const config = createSettingsConfigStub("settings");
    const store = new AsyncStorageSettingsStore(manager, config);

    await store.save("display", { theme: "dark" });
    await store.save("privacy", { analytics: false });

    const bulk = await store.loadAll();
    expect(bulk).toEqual({
      display: { theme: "dark" },
      privacy: { analytics: false },
    });
  });

  it("reports the storage driver identifier", () => {
    const { manager } = createFakeStorageBackend();
    const config = createSettingsConfigStub();
    const store = new AsyncStorageSettingsStore(manager, config);
    // The subclass inherits `driver = "storage"` from
    // StorageSettingsStore — the settings-store manager routes to
    // it via `createStorageDriver(...)` when config declares
    // `driver: "storage"`.
    expect(store.driver).toBe("storage");
  });
});
