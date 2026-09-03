/**
 * @file native-settings-config.interface.ts
 * @module @stackra/settings/native/interfaces
 * @description Fully-resolved native settings config exposed at
 *   {@link NATIVE_SETTINGS_CONFIG}.
 *
 *   Every field is populated by the module — screens drop `?.foo`
 *   chains after `useNativeSettingsConfig()` returns.
 *
 *   Native mirror of `@stackra/settings/react`'s
 *   `IWebSettingsModuleOptions.routePaths` — that surface owns URL
 *   segments; this one owns React Navigation screen names, safe-area
 *   edges, and a chevron toggle.
 */

/** Edges guarded by the screen-level `SafeAreaView`. */
export type SafeAreaEdge = "top" | "bottom" | "left" | "right";

/**
 * Screen-name registry used by {@link useSettingsNavigation}. Keeps
 * the RN app free to pick screen names that match its navigation
 * hierarchy (nested stack, tab bar, drawer, …) without settings
 * baking a specific screen name into every navigate call site.
 */
export interface INativeSettingsScreenNames {
  /** Screen name for the settings hub. @default "Settings" */
  readonly settings: string;

  /**
   * Screen name for a group detail. Consumers pass `{ groupKey }` as
   * params.
   *
   * @default "SettingsGroup"
   */
  readonly group: string;

  /**
   * Screen name for a visual section within a group. Consumers pass
   * `{ groupKey, sectionKey }` as params.
   *
   * @default "SettingsSection"
   */
  readonly section: string;

  /**
   * Screen name for the full-screen field editor. Consumers pass
   * `{ groupKey, fieldKey }` as params.
   *
   * @default "SettingsFieldEditor"
   */
  readonly fieldEditor: string;
}

/**
 * Fully-resolved native settings config. Layered on top of the
 * cross-platform `ISettingsConfig` exposed at `SETTINGS_CONFIG`.
 */
export interface INativeSettingsConfig {
  /**
   * Which edges the screen-level `SafeAreaView` guards. Defaults to
   * every edge so headers clear the notch / Dynamic Island and CTAs
   * clear the Android navigation bar. Consumers who render inside a
   * navigation container that owns the top edge (e.g. a React
   * Navigation stack with `headerShown: true`) pass
   * `["bottom", "left", "right"]` here to avoid double-padding.
   */
  readonly safeAreaEdges: readonly SafeAreaEdge[];

  /**
   * Whether the settings hub surfaces a right-chevron on every row.
   * Set to `false` when the tenant prefers a flatter iOS-13-style
   * chrome. Defaults to `true`.
   */
  readonly showChevron: boolean;

  /**
   * Screen name registry consumed by {@link useSettingsNavigation} to
   * dispatch typed `navigate(name, params)` calls without hardcoding
   * screen names into every screen callback.
   */
  readonly screenNames: INativeSettingsScreenNames;
}
