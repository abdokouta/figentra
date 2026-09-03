/**
 * @file settings-hub-page.interface.ts
 * @module @stackra/settings/react/pages/settings-hub-page
 * @description Props for the {@link SettingsHubPage} component.
 */

/**
 * Props accepted by {@link SettingsHubPage}.
 */
export interface ISettingsHubPageProps {
  /**
   * Called when the user selects a settings group. Receives the
   * group key so the caller can navigate to
   * `/settings/{groupKey}`. Router-agnostic — bind to whatever
   * router the app uses.
   */
  readonly onSelectGroup?: (groupKey: string) => void;

  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
