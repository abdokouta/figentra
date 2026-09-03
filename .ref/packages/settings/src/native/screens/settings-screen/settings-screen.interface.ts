/**
 * @file settings-screen.interface.ts
 * @module @stackra/settings/native/screens/settings-screen
 * @description Props for {@link SettingsScreen}.
 */

/**
 * Props for `<SettingsScreen>`.
 *
 * Every callback is optional. Consumer apps typically wire:
 * - `onGroupPress` — navigate to the group detail screen via
 *   `useSettingsNavigation().goToGroup(key)`.
 */
export interface ISettingsScreenProps {
  /**
   * Fires when the caller taps a group row. When omitted the screen
   * dispatches through {@link useSettingsNavigation} to the
   * configured group screen name.
   */
  readonly onGroupPress?: (groupKey: string) => void;
}
