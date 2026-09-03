/**
 * @file native-settings-module-options.interface.ts
 * @module @stackra/settings/native/interfaces
 * @description Options accepted by `NativeSettingsModule.forRoot(...)`.
 *
 *   Extends `ISettingsModuleOptions` — every field the core module
 *   accepts is forwarded verbatim so the caller configures stores,
 *   API, and broadcasting in ONE place. The native-only knobs
 *   (`safeAreaEdges`, `showChevron`, `screenNames`,
 *   `asyncStorageInstance`) stay in this shape.
 */

import type { ISettingsModuleOptions } from "@stackra/contracts";

import type { INativeSettingsScreenNames, SafeAreaEdge } from "./native-settings-config.interface";

/**
 * Static options for `NativeSettingsModule.forRoot(...)`.
 *
 * Every field is optional — the module runs with sensible defaults
 * (full-screen safe area, chevron visible, canonical `Settings*`
 * screen names, `asyncStorage` as the default store).
 *
 * @example
 * ```typescript
 * NativeSettingsModule.forRoot({
 *   safeAreaEdges: ["bottom", "left", "right"],
 *   screenNames: { fieldEditor: "AdminSettingsFieldEditor" },
 *   asyncStorageInstance: "settings",
 * });
 * ```
 */
export interface INativeSettingsModuleOptions extends ISettingsModuleOptions {
  /**
   * Edges guarded by the screen-level `SafeAreaView`. See
   * {@link INativeSettingsConfig.safeAreaEdges}.
   *
   * @default ["top", "bottom", "left", "right"]
   */
  readonly safeAreaEdges?: readonly SafeAreaEdge[];

  /**
   * Whether the settings hub surfaces a right-chevron on every row.
   * See {@link INativeSettingsConfig.showChevron}.
   *
   * @default true
   */
  readonly showChevron?: boolean;

  /**
   * Screen name registry consumed by {@link useSettingsNavigation}.
   * Any field omitted falls back to the workspace default
   * (`Settings`, `SettingsGroup`, `SettingsSection`,
   * `SettingsFieldEditor`).
   */
  readonly screenNames?: Partial<INativeSettingsScreenNames>;

  /**
   * Name of the `IStorage` instance in `STORAGE_MANAGER` the default
   * native settings store proxies to. The native module wires an
   * `asyncStorage`-named store by default (via the `stores` config),
   * so consumers who name their own instance differently pass that
   * name here.
   *
   * @default "asyncStorage"
   */
  readonly asyncStorageInstance?: string;
}
