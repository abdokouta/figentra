/**
 * @file native-settings.module.ts
 * @module @stackra/settings/native
 * @description React Native composition of
 *   `SettingsModule.forRoot`.
 *
 *   Imports the cross-platform core module (which binds
 *   `SETTINGS_CONFIG`, `SETTINGS_REGISTRY`, `SETTINGS_MANAGER`,
 *   `SETTINGS_SERVICE` and the SchemaFetcher + BroadcastListener)
 *   and layers on:
 *   - The RN-only config {@link NATIVE_SETTINGS_CONFIG} — safe-area
 *     edges, chevron visibility, and React Navigation screen names.
 *     Every native screen reads it through `useNativeSettingsConfig()`.
 *   - A defaulted `stores` map so the native surface persists to
 *     AsyncStorage out of the box. Consumers pass their own `stores`
 *     to override.
 *   - The {@link AsyncStorageSettingsStore} class as a first-class
 *     provider so bespoke seeders can inject it via DI.
 *
 *   ## What this module adds
 *
 *   1. Composes `SettingsModule.forRoot(coreOptions)` — every field
 *      the core module accepts forwards through (stores, groups,
 *      api, broadcasting, debounce). The `default` + `stores` fields
 *      are enriched with `asyncStorage` defaults when the caller
 *      omits them.
 *   2. Binds {@link NATIVE_SETTINGS_CONFIG} to the merged
 *      {@link INativeSettingsConfig}.
 *   3. Registers {@link AsyncStorageSettingsStore} — usable via
 *      `useInject<AsyncStorageSettingsStore>(AsyncStorageSettingsStore)`
 *      when the consumer wants a direct handle to the store class.
 *
 *   Satisfies `.kiro/steering/subpath-layering.md` §Shape 1 —
 *   composes core AND adds real DI bindings, never a pass-through.
 *   The RN-only config stays here (not in `@stackra/contracts`)
 *   because `SafeAreaEdge` has no meaning on the web surface —
 *   promoting would leak the type into browser bundles.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { NativeRoutingModule } from "@stackra/routing/native";

import { SettingsModule } from "../core/settings.module";

import { DEFAULT_ASYNC_STORAGE_INSTANCE, NATIVE_SETTINGS_CONFIG } from "./constants";
import { buildSettingsScreens } from "./screens/build-settings-screens.util";
import { AsyncStorageSettingsStore } from "./stores/async-storage-settings.store";

import type { ISettingsStoreConfig } from "@stackra/contracts";
import type {
  INativeSettingsConfig,
  INativeSettingsScreenNames,
} from "./interfaces/native-settings-config.interface";
import type { INativeSettingsModuleOptions } from "./interfaces/native-settings-module-options.interface";

/**
 * Canonical screen-name registry consumed by
 * `useSettingsNavigation` — the `Settings*` prefix pattern the
 * workspace ships. Consumers who use different screen names in
 * their navigator override via `screenNames`.
 */
const DEFAULT_SCREEN_NAMES: INativeSettingsScreenNames = {
  settings: "Settings",
  group: "SettingsGroup",
  section: "SettingsSection",
  fieldEditor: "SettingsFieldEditor",
} as const;

const DEFAULT_SAFE_AREA_EDGES = ["top", "bottom", "left", "right"] as const;

/**
 * Enrich the caller's `stores` map so a native-friendly default is
 * always present. When the caller ships their own store definition
 * for the same name, THAT wins — this only fills the gap.
 */
function withNativeStoresDefault(
  options: INativeSettingsModuleOptions,
  instanceName: string,
): Readonly<Record<string, ISettingsStoreConfig>> {
  const defaults: Record<string, ISettingsStoreConfig> = {
    memory: { driver: "memory" },
    // Compose the SETTINGS-side "storage" driver over the STORAGE-side
    // `asyncStorage` IStorage instance. That indirection is the
    // whole point of storage-usage.md §Rule 1 — no direct
    // AsyncStorage reads happen here; the storage manager owns the
    // peer.
    [instanceName]: { driver: "storage", storageInstance: instanceName },
  };

  return { ...defaults, ...(options.stores ?? {}) };
}

/**
 * React Native settings DI module. Import at the RN app's DI root
 * INSTEAD of `SettingsModule.forRoot(...)` — this module composes
 * the core module internally and adds the native-only bindings.
 *
 * @example
 * ```typescript
 * import { Module } from "@stackra/container";
 * import { NativeSettingsModule } from "@stackra/settings/native";
 * import { NativeStorageModule } from "@stackra/storage/native";
 *
 * @Module({
 *   imports: [
 *     // Required peer — the settings store composes over
 *     // `IStorageManager.instance('asyncStorage')`.
 *     NativeStorageModule.forRoot({
 *       default: 'asyncStorage',
 *       stores: { asyncStorage: { driver: 'asyncStorage' } },
 *     }),
 *     NativeSettingsModule.forRoot({
 *       // Native module defaults `default: 'asyncStorage'` +
 *       // `stores: { asyncStorage: { driver: 'storage',
 *       // storageInstance: 'asyncStorage' } }` when omitted.
 *       safeAreaEdges: ["bottom", "left", "right"],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NativeSettingsModule {
  /**
   * Configure the native settings module with static options.
   *
   * @param options - Options — every field optional.
   *   `safeAreaEdges` defaults to every edge; `showChevron` defaults
   *   to `true`; `screenNames` defaults to the canonical `Settings*`
   *   prefix; `default` defaults to `"asyncStorage"`; `stores` gets
   *   an `asyncStorage` + `memory` pair when omitted.
   * @returns A `DynamicModule` ready to add to `imports`.
   */
  public static forRoot(options: INativeSettingsModuleOptions = {}): DynamicModule {
    // Fork the caller's options into two shapes:
    // - `coreOptions` — the fields `SettingsModule.forRoot(...)` accepts.
    // - `nativeConfig` — the resolved native-only config bound at
    //   `NATIVE_SETTINGS_CONFIG`. ADR-0063 canonical shape — no
    //   mergeConfig util; every RN-only knob gets an inline `??`
    //   default at the single call site.
    const {
      safeAreaEdges,
      showChevron,
      screenNames,
      asyncStorageInstance,
      ...coreOptionsWithStores
    } = options;

    const instanceName = asyncStorageInstance ?? DEFAULT_ASYNC_STORAGE_INSTANCE;

    // Enrich the caller's `stores` map so an `asyncStorage`-named
    // settings store is always present. If the caller shipped their
    // own entry for the same name, theirs wins.
    const stores = withNativeStoresDefault(coreOptionsWithStores, instanceName);

    // Default `default` to the async-storage instance name if the
    // caller didn't set one. Consumers who really want an in-memory
    // default at boot pass `default: "memory"` explicitly.
    const coreOptions = {
      ...coreOptionsWithStores,
      stores,
      default: coreOptionsWithStores.default ?? instanceName,
    };

    const nativeConfig: INativeSettingsConfig = {
      safeAreaEdges: safeAreaEdges ?? DEFAULT_SAFE_AREA_EDGES,
      showChevron: showChevron ?? true,
      screenNames: {
        ...DEFAULT_SCREEN_NAMES,
        ...(screenNames ?? {}),
      },
    };

    return {
      module: NativeSettingsModule,
      global: true,
      imports: [
        // Compose the cross-platform core module. `SETTINGS_CONFIG`,
        // `SETTINGS_REGISTRY`, `SETTINGS_MANAGER`, `SETTINGS_SERVICE`
        // bind inside the composed module — screens consume them
        // through the same tokens the web subpath uses.
        SettingsModule.forRoot(coreOptions),

        // Register the four settings screens with the workspace
        // routing module's screen registry. `useStackraNativeRouting()`
        // returns them alongside every other feature-contributed
        // screen.
        NativeRoutingModule.forFeature({
          name: "settings",
          screens: buildSettingsScreens(nativeConfig),
        }),
      ],
      providers: [
        { provide: NATIVE_SETTINGS_CONFIG, useValue: nativeConfig },
        // Register the concrete store class as a first-class
        // provider so bespoke seeders can inject it via DI.
        AsyncStorageSettingsStore,
      ],
      // Re-export `SettingsModule` so consumers who import the native
      // module reach the core tokens (`SETTINGS_CONFIG`,
      // `SETTINGS_REGISTRY`, `SETTINGS_MANAGER`, `SETTINGS_SERVICE`)
      // without a second import.
      exports: [SettingsModule, NATIVE_SETTINGS_CONFIG, AsyncStorageSettingsStore],
    };
  }
}
