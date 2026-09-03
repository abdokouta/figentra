/**
 * @file settings-group-page.interface.ts
 * @module @stackra/settings/react/pages/settings-group-page
 * @description Props for the {@link SettingsGroupPage} component.
 */

/**
 * Props accepted by {@link SettingsGroupPage}.
 */
export interface ISettingsGroupPageProps {
  /**
   * Optional group-key override. When omitted the page reads
   * `:groupKey` from the router's `useParams()`. Consumers pass
   * this in tests + Storybook to mount the page outside a router.
   */
  readonly groupKey?: string;

  /**
   * Called when the user presses the "Back to Settings" affordance.
   * Router-agnostic — bind to whatever router the app uses.
   */
  readonly onBack?: () => void;

  /** Additional CSS classes appended to the root. */
  readonly className?: string;

  /** Whether every field renders read-only. */
  readonly isReadOnly?: boolean;

  /** Whether every field is disabled. */
  readonly isDisabled?: boolean;
}
