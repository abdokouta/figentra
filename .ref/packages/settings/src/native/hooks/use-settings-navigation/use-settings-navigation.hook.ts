/**
 * @file use-settings-navigation.hook.ts
 * @module @stackra/settings/native/hooks/use-settings-navigation
 * @description `useSettingsNavigation()` — typed React Navigation
 *   helper for the settings screen surface.
 *
 *   Wraps `@react-navigation/native`'s `useNavigation()` with the
 *   resolved screen names from {@link NATIVE_SETTINGS_CONFIG} so
 *   consumers dispatch typed `navigate(name, params)` calls without
 *   hardcoding screen names into every screen callback:
 *
 *   ```tsx
 *   const nav = useSettingsNavigation();
 *   nav.goToGroup("display");
 *   nav.goToFieldEditor("display", "font_size");
 *   nav.back();
 *   ```
 *
 *   The hook is a THIN wrapper — it only routes calls through
 *   `@react-navigation/native`. Consumers who prefer to call
 *   `navigation.navigate(...)` directly can skip this hook and use
 *   the {@link ISettingsRouteParamList} type directly on their
 *   `NavigationProp`.
 *
 *   `@react-navigation/native` is an OPTIONAL peer per the package's
 *   `peerDependenciesMeta` — consumers who don't use React
 *   Navigation never call this hook, so the peer stays optional at
 *   install time.
 */

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import { useNativeSettingsConfig } from "../use-native-settings-config/use-native-settings-config.hook";

import type { ISettingsNavigation } from "./use-settings-navigation.interface";
import type { INativeNavigation } from "@stackra/contracts";

/**
 * Typed navigation helper for the settings native surface.
 *
 * Requires `@react-navigation/native` to be present in the consumer
 * app — this is an OPTIONAL peer per the package's
 * `peerDependenciesMeta`. Apps that don't use React Navigation skip
 * this hook entirely.
 *
 * @returns Stable {@link ISettingsNavigation} object.
 *
 * @example
 * ```tsx
 * import { useSettingsNavigation } from "@stackra/settings/native";
 *
 * function GroupRow({ groupKey }: { groupKey: string }) {
 *   const nav = useSettingsNavigation();
 *   return (
 *     <ListGroup.Item onPress={() => nav.goToGroup(groupKey)}>
 *       ...
 *     </ListGroup.Item>
 *   );
 * }
 * ```
 */
export function useSettingsNavigation(): ISettingsNavigation {
  const { screenNames } = useNativeSettingsConfig();
  // `useNavigation()` is React Navigation's untyped escape hatch.
  // The `: INativeNavigation` annotation (from `@stackra/contracts`)
  // narrows the call-site view of the value to the three methods
  // every workspace consumer uses. `INativeNavigation` was promoted
  // per `.kiro/steering/contracts-and-decorators-promotion.md`
  // §"Test A — Multi-consumer" after the same shim was found in
  // five packages.
  const navigation: INativeNavigation = useNavigation();

  // Memoise the returned object so consumers using it as a hook
  // dependency don't re-run their own effects on every render.
  return useMemo<ISettingsNavigation>(
    () => ({
      goToSettings: (): void => {
        navigation.navigate(screenNames.settings);
      },
      goToGroup: (groupKey: string): void => {
        navigation.navigate(screenNames.group, { groupKey });
      },
      goToSection: (groupKey: string, sectionKey: string): void => {
        navigation.navigate(screenNames.section, { groupKey, sectionKey });
      },
      goToFieldEditor: (groupKey: string, fieldKey: string): void => {
        navigation.navigate(screenNames.fieldEditor, { groupKey, fieldKey });
      },
      back: (): void => {
        navigation.goBack();
      },
    }),
    [navigation, screenNames],
  );
}
