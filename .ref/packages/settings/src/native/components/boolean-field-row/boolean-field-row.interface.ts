/**
 * @file boolean-field-row.interface.ts
 * @module @stackra/settings/native/components/boolean-field-row
 * @description Props for {@link BooleanFieldRow}.
 */

import type { ISettingField } from "@stackra/contracts";

/**
 * Props for `<BooleanFieldRow>`.
 */
export interface IBooleanFieldRowProps {
  /**
   * The resolved field descriptor — provides `key`, `label`,
   * `description`, and the `readOnly` flag the row honours by
   * disabling the switch.
   */
  readonly field: ISettingField;

  /** Current value from the settings store. */
  readonly value: boolean;

  /** Fires when the user flips the switch. */
  readonly onChange: (next: boolean) => void;

  /** When `true`, disables the switch regardless of `field.readOnly`. */
  readonly disabled?: boolean;
}
