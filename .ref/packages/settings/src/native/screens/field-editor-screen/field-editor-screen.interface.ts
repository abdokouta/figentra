/**
 * @file field-editor-screen.interface.ts
 * @module @stackra/settings/native/screens/field-editor-screen
 * @description Props for {@link FieldEditorScreen}.
 */

/**
 * Props for `<FieldEditorScreen>`.
 */
export interface IFieldEditorScreenProps {
  /**
   * The group key. Falls back to a route param (`groupKey`) when
   * omitted.
   */
  readonly groupKey?: string;

  /**
   * The field key within the group. Falls back to a route param
   * (`fieldKey`) when omitted.
   */
  readonly fieldKey?: string;

  /**
   * Fires when the user saves the edit. When omitted the screen
   * writes back through `SettingsService.set(...)` and pops via
   * {@link useSettingsNavigation}'s `back()`.
   */
  readonly onSave?: (groupKey: string, fieldKey: string, value: unknown) => void;
}
