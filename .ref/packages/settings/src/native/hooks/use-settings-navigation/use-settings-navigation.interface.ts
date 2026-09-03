/**
 * @file use-settings-navigation.interface.ts
 * @module @stackra/settings/native/hooks/use-settings-navigation
 * @description Return type for {@link useSettingsNavigation}.
 */

/**
 * Return type of {@link useSettingsNavigation}. Every method routes
 * through `@react-navigation/native`'s `navigate()`; `back()` routes
 * through `goBack()`.
 */
export interface ISettingsNavigation {
  /** Navigate to the settings hub. */
  readonly goToSettings: () => void;

  /** Navigate to a group detail screen. */
  readonly goToGroup: (groupKey: string) => void;

  /**
   * Navigate to a visual section within a group. The section key
   * matches a key in `ISettingDefinition.sections` or an
   * `ISettingVisualGroup.label`.
   */
  readonly goToSection: (groupKey: string, sectionKey: string) => void;

  /** Navigate to the full-screen field editor. */
  readonly goToFieldEditor: (groupKey: string, fieldKey: string) => void;

  /** Pop the current route off the stack. */
  readonly back: () => void;
}
