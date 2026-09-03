/**
 * @file async-storage-settings.store.ts
 * @module @stackra/settings/native/stores
 * @description `ISettingsStore` backed by React Native's
 *   AsyncStorage — reached through `@stackra/storage/native`'s
 *   `IStorageManager`, never through the `@react-native-async-storage
 *   /async-storage` peer directly.
 *
 *   Contract compliance:
 *   - Extends the core {@link StorageSettingsStore} — identical
 *     `load` / `save` / `clear` / `loadAll` semantics + TTL / prefix
 *     handling from `IStorage`. The native flavour just PINS the
 *     backing `IStorage` instance to the AsyncStorage-named entry
 *     resolved from the injected `IStorageManager`.
 *   - Routes every persistence call through
 *     `manager.instance(instanceName)` — the storage manager's
 *     driver factory (registered by
 *     `NativeStorageModule.forFeature('asyncStorage', ...)`) is the
 *     one place `@react-native-async-storage/async-storage` is
 *     imported. This file NEVER imports the peer directly, per
 *     `.kiro/steering/storage-usage.md` §Rule 1.
 *
 *   ## When to reach for this store
 *
 *   `NativeSettingsModule.forRoot(...)` wires an `asyncStorage`-named
 *   {@link StorageSettingsStore} through the standard `stores` config
 *   by default — that path is enough for 95% of consumers. Reach for
 *   `AsyncStorageSettingsStore` directly when:
 *   - Manually seeding a `SettingsStoreManager` via
 *     `manager.extend(name, () => new AsyncStorageSettingsStore(...))`.
 *   - Providing a hand-instantiated store to a test double.
 *   - Composing a bespoke settings driver on top of AsyncStorage
 *     without touching the core `stores` config shape.
 *
 *   Consumers who just want the RN preset never instantiate this
 *   class directly — the native module's defaults handle it.
 */

import { Inject, Injectable } from "@stackra/container";
import {
  SETTINGS_CONFIG,
  STORAGE_MANAGER,
  type ISettingsConfig,
  type IStorageManager,
} from "@stackra/contracts";

import { StorageSettingsStore } from "../../core/stores/storage-settings.store";

import { DEFAULT_ASYNC_STORAGE_INSTANCE } from "../constants/default-async-storage-instance.constant";

/**
 * Options accepted by {@link AsyncStorageSettingsStore}.
 *
 * Every field is optional — the class picks the same defaults
 * `NativeSettingsModule.forRoot(...)` uses so hand-instantiation
 * matches the module-managed path.
 */
export interface IAsyncStorageSettingsStoreOptions {
  /**
   * `IStorage` instance name in `STORAGE_MANAGER`. Defaults to
   * `"asyncStorage"` — the name the native storage module registers
   * via `StorageModule.forFeature('asyncStorage', factory)`.
   */
  readonly instanceName?: string;

  /**
   * Prefix appended to every group key before writing. Defaults to
   * `ISettingsConfig.prefix`.
   */
  readonly prefix?: string;
}

/**
 * `ISettingsStore` backed by React Native AsyncStorage — resolved
 * through `IStorageManager`, so the `@react-native-async-storage/
 * async-storage` peer stays isolated to `@stackra/storage/native`.
 *
 * @example
 * ```typescript
 * import { AsyncStorageSettingsStore } from "@stackra/settings/native";
 * import { STORAGE_MANAGER, SETTINGS_CONFIG } from "@stackra/contracts";
 *
 * @Injectable()
 * class BespokeSeeder implements OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(SETTINGS_MANAGER) private readonly manager: ISettingsManager,
 *     @Inject(STORAGE_MANAGER) private readonly storage: IStorageManager,
 *     @Inject(SETTINGS_CONFIG) private readonly config: ISettingsConfig,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     this.manager.extend("asyncStorage", () =>
 *       new AsyncStorageSettingsStore({
 *         storageManager: this.storage,
 *         config: this.config,
 *         instanceName: "settings",
 *       }),
 *     );
 *   }
 * }
 * ```
 */
@Injectable()
export class AsyncStorageSettingsStore extends StorageSettingsStore {
  /**
   * DI-friendly constructor — injects the storage manager + settings
   * config so the container can build this class as a first-class
   * provider. Consumers who need to pass custom options build a
   * subclass or call {@link StorageSettingsStore} directly with the
   * exact instance they need.
   *
   * @param storageManager - The `IStorageManager` from
   *   `@stackra/storage/native`.
   * @param settingsConfig - The merged `ISettingsConfig` — used to
   *   read `prefix` when the caller doesn't override it.
   */
  public constructor(
    @Inject(STORAGE_MANAGER) storageManager: IStorageManager,
    @Inject(SETTINGS_CONFIG) settingsConfig: ISettingsConfig,
  ) {
    // `StorageSettingsStore` already implements every `ISettingsStore`
    // method — this subclass just pins the manager + instance name.
    // Prefix falls back to the settings config so multiple settings
    // stores backed by the same AsyncStorage stay isolated.
    super({
      manager: storageManager,
      instanceName: DEFAULT_ASYNC_STORAGE_INSTANCE,
      prefix: settingsConfig.prefix,
    });
  }
}
