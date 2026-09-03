/**
 * @file permission-field-row.interface.ts
 * @module @stackra/settings/native/components/permission-field-row
 * @description Props for {@link PermissionFieldRow}.
 */

import type { ISettingField } from "@stackra/contracts";

/**
 * Props for `<PermissionFieldRow>`.
 */
export interface IPermissionFieldRowProps {
  /**
   * The resolved field descriptor — `label` renders as the row
   * title, `description` renders below as a "Manage in system
   * settings" hint.
   */
  readonly field: ISettingField;

  /**
   * Optional current permission state — surfaced in the description
   * slot when the app knows it (e.g. via
   * `expo-notifications.getPermissionsAsync()`). When omitted, the
   * row falls back to the field's own `description`.
   */
  readonly currentState?: "granted" | "denied" | "undetermined";

  /**
   * Optional custom press handler. When omitted the row opens the
   * OS Settings app via {@link useSystemSettings}.
   */
  readonly onPress?: () => void;
}
