/**
 * @file settings-row.interface.ts
 * @module @stackra/settings/native/components/settings-row
 * @description Props for {@link SettingsRow}.
 */

/**
 * Props for `<SettingsRow>`.
 *
 * A generic ListGroup row used by the settings hub to represent one
 * registered group. The row surfaces title + optional description
 * and delegates its press behaviour to the caller.
 */
export interface ISettingsRowProps {
  /** Row title — typically the group's `label`. */
  readonly title: string;

  /**
   * Optional description — typically the group's `description`, or a
   * summary of the current value for a leaf row.
   */
  readonly description?: string;

  /** Fires when the row is pressed. */
  readonly onPress?: () => void;

  /**
   * Whether the row surfaces a right-chevron. Reads
   * {@link INativeSettingsConfig.showChevron} by default at the
   * screen level, but callers can override via this prop.
   *
   * @default true
   */
  readonly showChevron?: boolean;

  /** When `true`, the row renders in a disabled state. */
  readonly disabled?: boolean;
}
