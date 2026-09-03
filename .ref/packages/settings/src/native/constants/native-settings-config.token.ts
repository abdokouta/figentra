/**
 * @file native-settings-config.token.ts
 * @module @stackra/settings/native/constants
 * @description DI token for the resolved
 *   {@link INativeSettingsConfig}.
 *
 *   Native-specific companion to `@stackra/contracts`'s
 *   `SETTINGS_CONFIG`. The core token carries the merged
 *   `ISettingsConfig` (default store, stores map, prefix, groups,
 *   debounce, api, broadcasting); this token layers on RN-only
 *   knobs — safe-area edges, chevron visibility, and the React
 *   Navigation screen names.
 *
 *   Kept in the native subpath because none of the fields are
 *   meaningful on the web surface (`SafeAreaEdge` has no analog in
 *   the browser). Promoting to `@stackra/contracts` would leak the
 *   type into browser bundles without value.
 */

/**
 * DI token — resolved by `NativeSettingsModule.forRoot(options)`.
 * Every native screen and every `useSettingsNavigation()` consumer
 * reads this token via `useNativeSettingsConfig()`.
 */
export const NATIVE_SETTINGS_CONFIG = Symbol.for("NATIVE_SETTINGS_CONFIG");
