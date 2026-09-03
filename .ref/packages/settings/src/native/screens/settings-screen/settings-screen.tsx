/**
 * @file settings-screen.tsx
 * @module @stackra/settings/native/screens/settings-screen
 * @description `<SettingsScreen>` — the top-level settings hub.
 *
 *   Lists every registered settings group via
 *   {@link useSettingsSchema} (from the core subpath) and renders
 *   them through {@link SettingsList}. Tapping a row dispatches to
 *   {@link useSettingsNavigation}'s `goToGroup(key)`.
 *
 *   Composes HeroUI Native primitives via `@stackra/ui/native` and
 *   `SafeAreaView` from `react-native-safe-area-context` (HeroUI
 *   Native does not ship one — verified via MCP `list_components`).
 *
 *   Every user-facing string routes through `useNativeSettingsT()` —
 *   no literal English text per
 *   `.kiro/steering/frontend-localization.md`.
 */

import { useCallback, type ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSettingsSchema } from "../../../core/hooks/use-settings-schema/use-settings-schema.hook";

import { SettingsList } from "../../components/settings-list/settings-list.component";
import { useNativeSettingsConfig } from "../../hooks/use-native-settings-config/use-native-settings-config.hook";
import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useSettingsNavigation } from "../../hooks/use-settings-navigation/use-settings-navigation.hook";

import type { ISettingsScreenProps } from "./settings-screen.interface";

/**
 * Top-level settings hub — the entry point for every settings
 * subscreen.
 *
 * @param props - {@link ISettingsScreenProps}.
 *
 * @example
 * ```tsx
 * import { SettingsScreen } from "@stackra/settings/native";
 *
 * <Stack.Screen name="Settings" component={SettingsScreen} />
 * ```
 */
export function SettingsScreen(props: ISettingsScreenProps = {}): ReactElement {
  const { onGroupPress } = props;
  const { safeAreaEdges } = useNativeSettingsConfig();
  const groups = useSettingsSchema();
  const t = useNativeSettingsT();
  const nav = useSettingsNavigation();

  // Default press behaviour dispatches to the group screen via the
  // navigation helper; consumers override with `onGroupPress`.
  const handleGroupPress = useCallback(
    (groupKey: string): void => {
      if (onGroupPress) {
        onGroupPress(groupKey);
        return;
      }
      nav.goToGroup(groupKey);
    },
    [onGroupPress, nav],
  );

  return (
    <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
      {/* Screen header — mounted OUTSIDE the ScrollView so it stays
          pinned even when the list is long. */}
      <View className="p-4">
        <Text className="text-foreground text-2xl font-semibold">{t("hub.title")}</Text>
        <Text className="text-muted mt-1 text-sm">{t("hub.description")}</Text>
      </View>

      {/* Body — grouped settings list. When there are no groups the
          list itself renders the empty-state; we still wrap in a
          ScrollView so long lists remain scrollable when needed. */}
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <SettingsList groups={groups} onGroupPress={handleGroupPress} />
      </ScrollView>
    </SafeAreaView>
  );
}

SettingsScreen.displayName = "SettingsScreen";
