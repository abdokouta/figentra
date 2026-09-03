/**
 * @file field-renderer.interface.ts
 * @module @stackra/settings/native/components/field-renderer
 * @description Props for {@link FieldRenderer}.
 */

import type { ISettingField } from "@stackra/contracts";

/**
 * Props for `<FieldRenderer>`.
 *
 * The renderer dispatches over `field.control` (a `ControlType` case
 * or a bespoke string) to the correct row component. It expects the
 * caller to have resolved the field's current value from the
 * settings service and supply an `onChange` handler that persists
 * writes back through `SettingsService.set(...)`.
 */
export interface IFieldRendererProps {
  /** The resolved field descriptor. */
  readonly field: ISettingField;

  /**
   * Group key the field belongs to — passed through to
   * {@link TextFieldRow} so it can dispatch to the field-editor
   * screen with typed params.
   */
  readonly groupKey: string;

  /** Current value from the settings store. */
  readonly value: unknown;

  /** Fires when the user changes the field's value. */
  readonly onChange: (next: unknown) => void;

  /** When `true`, every row renders in a disabled state. */
  readonly disabled?: boolean;
}
