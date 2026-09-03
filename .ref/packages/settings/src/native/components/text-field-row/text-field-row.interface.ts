/**
 * @file text-field-row.interface.ts
 * @module @stackra/settings/native/components/text-field-row
 * @description Props for {@link TextFieldRow}.
 */

import type { ISettingField } from "@stackra/contracts";

/**
 * Props for `<TextFieldRow>`.
 */
export interface ITextFieldRowProps {
  /**
   * The resolved field descriptor — provides `key`, `label`,
   * `description`, `placeholder`, and the `readOnly` flag.
   */
  readonly field: ISettingField;

  /**
   * Group key the field belongs to — used to build the navigation
   * params for the field-editor screen.
   */
  readonly groupKey: string;

  /**
   * Current stored value. Rendered in the row's description slot so
   * the user sees the current text without opening the editor.
   */
  readonly value: string | number | null;

  /**
   * Optional custom press handler. When omitted the row navigates
   * to the field-editor screen via {@link useSettingsNavigation}.
   */
  readonly onPress?: (groupKey: string, fieldKey: string) => void;

  /** When `true`, the row renders read-only (no press behaviour). */
  readonly disabled?: boolean;
}
