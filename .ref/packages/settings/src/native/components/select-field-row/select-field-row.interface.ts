/**
 * @file select-field-row.interface.ts
 * @module @stackra/settings/native/components/select-field-row
 * @description Props for {@link SelectFieldRow}.
 */

import type { ISettingField, ISettingFieldOption } from "@stackra/contracts";

/**
 * Props for `<SelectFieldRow>`.
 */
export interface ISelectFieldRowProps {
  /**
   * The resolved field descriptor — provides `key`, `label`,
   * `description`, and the option list (`options` or resolved via
   * `optionsProvider`).
   */
  readonly field: ISettingField;

  /**
   * Resolved options — the row's caller resolves
   * `field.optionsProvider` externally when the descriptor doesn't
   * carry a static `options` list.
   */
  readonly options: readonly ISettingFieldOption[];

  /** Current value from the settings store. */
  readonly value: string | number | boolean | null;

  /** Fires when the user selects a new option from the sheet. */
  readonly onChange: (next: string | number | boolean) => void;

  /** When `true`, the row renders read-only. */
  readonly disabled?: boolean;
}
