/**
 * @file index.ts
 * @module @stackra/settings/native/screens
 * @description Barrel for the four native settings screens.
 *
 *   - {@link SettingsScreen} — top-level hub of registered groups.
 *   - {@link GroupScreen} — one group's fields (with inline visual
 *     sub-group headers).
 *   - {@link SectionScreen} — one visual sub-group as its own
 *     drill-down screen.
 *   - {@link FieldEditorScreen} — full-screen text editor for
 *     complex fields.
 */

export { FieldEditorScreen, type IFieldEditorScreenProps } from "./field-editor-screen";
export { GroupScreen, type IGroupScreenProps } from "./group-screen";
export { SectionScreen, type ISectionScreenProps } from "./section-screen";
export { SettingsScreen, type ISettingsScreenProps } from "./settings-screen";
