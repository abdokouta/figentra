/**
 * @file build-settings-screens.util.ts
 * @module @stackra/settings/native/screens
 * @description `buildSettingsScreens(nativeConfig)` — assemble the
 *   four native settings screens into `IScreenRecord[]` for
 *   `NativeRoutingModule.forFeature({ screens })`.
 *
 *   Native mirror of `buildSettingsRoutes()` on the web subpath.
 *   Screen names come from
 *   {@link INativeSettingsConfig.screenNames}; the two screens
 *   with a web equivalent (hub, group) reuse the web route paths
 *   from {@link SETTINGS_ROUTE_PATHS}. The two drill-down screens
 *   (section, fieldEditor) ship without a deep-link path — they
 *   open via `navigation.navigate(name, params)`.
 */

import type { INativeSettingsConfig } from "../interfaces/native-settings-config.interface";
import type { IScreenRecord } from "@stackra/contracts";

import { FieldEditorScreen } from "./field-editor-screen";
import { GroupScreen } from "./group-screen";
import { SectionScreen } from "./section-screen";
import { SettingsScreen } from "./settings-screen";

/**
 * Build the ordered list of settings screen records.
 *
 * @param nativeConfig - The merged native settings config —
 *   provides `screenNames` for the four entries.
 * @returns Ordered array of four screen records, ready to pass to
 *   `NativeRoutingModule.forFeature({ screens })`.
 */
export function buildSettingsScreens(
  nativeConfig: INativeSettingsConfig,
): readonly IScreenRecord[] {
  const { screenNames } = nativeConfig;

  return [
    {
      name: screenNames.settings,
      component: SettingsScreen,
      // Mirrors the web `SettingsHubRoute` decorator path.
      path: "/settings",
    },
    {
      name: screenNames.group,
      component: GroupScreen,
      // Mirrors the web `SettingsGroupRoute` decorator path.
      path: "/settings/:groupKey",
    },
    // Section + fieldEditor open via navigate() — no deep-link
    // path (they need extra params the URL contract does not
    // encode today).
    { name: screenNames.section, component: SectionScreen },
    { name: screenNames.fieldEditor, component: FieldEditorScreen },
  ];
}
