/**
 * @file settings-route-param-list.interface.ts
 * @module @stackra/settings/native/interfaces
 * @description Route-param map for the settings native screens.
 *
 *   Consumers who use a typed React Navigation stack extend their
 *   root param list with this shape so `navigate("SettingsGroup",
 *   { groupKey })` gets full-type validation. The screen NAMES
 *   themselves are configurable via
 *   {@link INativeSettingsScreenNames} — this shape only pins the
 *   PARAM shape per screen.
 */

/**
 * Param map keyed by CANONICAL screen name — consumers who rename
 * screens via {@link INativeSettingsScreenNames} still route the
 * SAME param shape.
 */
export interface ISettingsRouteParamList {
  /** Settings hub — no params. */
  readonly Settings: undefined;

  /** One group's detail view — a single group key. */
  readonly SettingsGroup: { readonly groupKey: string };

  /**
   * One visual section within a group — the section key matches a
   * key in `ISettingDefinition.sections` or a value in an
   * `ISettingVisualGroup.label`.
   */
  readonly SettingsSection: { readonly groupKey: string; readonly sectionKey: string };

  /** Full-screen field editor — group key + field key. */
  readonly SettingsFieldEditor: { readonly groupKey: string; readonly fieldKey: string };
}
