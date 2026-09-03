/**
 * @file use-native-settings-config.hook.ts
 * @module @stackra/settings/native/hooks/use-native-settings-config
 * @description `useNativeSettingsConfig()` — reads the fully-resolved
 *   `INativeSettingsConfig` bound at {@link NATIVE_SETTINGS_CONFIG}.
 *
 *   Companion to the cross-platform `SETTINGS_CONFIG` — that token
 *   exposes stores / prefix / api / broadcasting knobs; this one
 *   exposes RN-only knobs (safe-area edges, chevron visibility,
 *   React Navigation screen names).
 *
 *   Screens read BOTH — the core config drives persistence, and the
 *   native config drives RN-specific chrome. Splitting them keeps
 *   the core config free of RN-only fields (`SafeAreaEdge` would be
 *   meaningless on web).
 */

import { useInject } from "@stackra/container/native";

import { NATIVE_SETTINGS_CONFIG } from "../../constants/native-settings-config.token";

import type { INativeSettingsConfig } from "../../interfaces/native-settings-config.interface";

/**
 * Return the merged native settings config.
 *
 * @returns The `INativeSettingsConfig` bound by
 *   `NativeSettingsModule.forRoot(...)`. Throws when the module
 *   isn't imported.
 *
 * @example
 * ```tsx
 * import { useNativeSettingsConfig } from "@stackra/settings/native";
 *
 * function SettingsScreen() {
 *   const { safeAreaEdges, showChevron } = useNativeSettingsConfig();
 *   return <SafeAreaView edges={safeAreaEdges}>...</SafeAreaView>;
 * }
 * ```
 */
export function useNativeSettingsConfig(): INativeSettingsConfig {
  return useInject<INativeSettingsConfig>(NATIVE_SETTINGS_CONFIG);
}
