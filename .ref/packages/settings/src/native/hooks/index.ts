/**
 * @file index.ts
 * @module @stackra/settings/native/hooks
 * @description Barrel for every native-only hook shipped by the
 *   native subpath.
 *
 *   - {@link useNativeSettingsConfig} — reads the RN-only config
 *     ({@link INativeSettingsConfig}) — safe-area edges, chevron
 *     visibility, screen names.
 *   - {@link useNativeSettingsT} — translator adapter that routes
 *     through `@stackra/i18n/native`.
 *   - {@link useSettingsNavigation} — typed React Navigation helper.
 *   - {@link useSystemSettings} — `Linking.openSettings()` wrapper
 *     for permission-managed rows.
 */

export { useNativeSettingsConfig } from "./use-native-settings-config";
export { useNativeSettingsT, type NativeSettingsTranslator } from "./use-native-settings-t";
export { useSettingsNavigation, type ISettingsNavigation } from "./use-settings-navigation";
export { useSystemSettings, type IUseSystemSettingsResult } from "./use-system-settings";
