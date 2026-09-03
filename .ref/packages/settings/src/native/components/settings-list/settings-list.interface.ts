/**
 * @file settings-list.interface.ts
 * @module @stackra/settings/native/components/settings-list
 * @description Props for {@link SettingsList}.
 */

import type { ISettingDefinition } from "@stackra/contracts";

/**
 * Props for `<SettingsList>`.
 *
 * The list wraps the standard React Native `FlatList` (imported from
 * `react-native` — the workspace does NOT ship `@shopify/flash-list`
 * as a peer of this package by default per the plan, so consumers
 * with FlashList swap out via the {@link ISettingsListProps.renderList}
 * prop).
 *
 * We stay on `FlatList` for the built-in list to keep the peer dep
 * surface tight — the plan documents FlashList as an optional peer
 * that consumers can opt into by wiring their own renderer.
 */
export interface ISettingsListProps {
  /**
   * Definitions to render — usually every registered group from
   * `useSettingsSchema()`, filtered by permission or feature flag
   * upstream.
   */
  readonly groups: readonly ISettingDefinition[];

  /**
   * Fires when a group row is pressed. Consumers typically navigate
   * to the group detail screen via
   * `useSettingsNavigation().goToGroup(groupKey)`.
   */
  readonly onGroupPress?: (groupKey: string) => void;

  /**
   * Optional bespoke row renderer — receives a definition and
   * returns any React element. When omitted the list falls back to
   * the built-in {@link SettingsRow}.
   */
  readonly renderItem?: (group: ISettingDefinition) => React.ReactElement;

  /** Passthrough className applied to the FlatList container. */
  readonly className?: string;
}
