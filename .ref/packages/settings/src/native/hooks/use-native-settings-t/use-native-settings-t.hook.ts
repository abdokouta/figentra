/**
 * @file use-native-settings-t.hook.ts
 * @module @stackra/settings/native/hooks/use-native-settings-t
 * @description `useNativeSettingsT()` — thin wrapper around
 *   `@stackra/i18n/native`'s `useI18n()` that returns just the
 *   translator function.
 *
 *   Native mirror of any translator adapter — every screen under
 *   `@stackra/settings/native` reads it instead of destructuring
 *   `useI18n()` at every call site. Same key convention as the web
 *   pages (`t("settings.hub.title")`) so both subpaths share
 *   `src/core/i18n/{en,ar}.json` verbatim.
 *
 *   The runtime prefixes every key with the package's directory name
 *   (`settings`) at build time, so this file writes keys WITHOUT the
 *   `settings.` prefix — the runtime adds it.
 */

import { useI18n } from "@stackra/i18n/native";

/**
 * Translator signature. Interpolation uses `useI18n`'s `args` shape.
 */
export type NativeSettingsTranslator = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

/**
 * Return the interpolating translator from the workspace i18n
 * provider.
 *
 * @returns A stable `t(key, params?)` function.
 *
 * @example
 * ```tsx
 * import { useNativeSettingsT } from "@stackra/settings/native";
 *
 * function SettingsScreenHeader() {
 *   const t = useNativeSettingsT();
 *   return <Text>{t("hub.title")}</Text>;
 * }
 * ```
 */
export function useNativeSettingsT(): NativeSettingsTranslator {
  const { t } = useI18n();
  return (key, params) => {
    if (params === undefined) return t(key);
    // `@stackra/i18n`'s `t` accepts `{ args }` — normalise for
    // callers that pass a flat object of interpolation values.
    return t(key, { args: params });
  };
}
