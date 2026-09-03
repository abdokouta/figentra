/**
 * @file text-field-row.component.tsx
 * @module @stackra/settings/native/components/text-field-row
 * @description `<TextFieldRow>` — a `ListGroup.Item` that opens the
 *   full-screen {@link FieldEditorScreen} on press.
 *
 *   Complex fields (long text, JSON, URL, password) benefit from a
 *   full-screen editor rather than an inline input, so the row
 *   itself just previews the current value and dispatches navigation
 *   on tap. Consumers who want a bespoke handler pass `onPress`.
 *
 *   Sensitive fields (`field.sensitive === true`) mask their value
 *   preview with a fixed placeholder so passwords never render in
 *   the row.
 *
 *   Compound APIs verified via HeroUI Native MCP `get_component_docs`
 *   for ListGroup — see {@link BooleanFieldRow} for the shared
 *   `ItemContent > (Title + Description) + ItemSuffix chevron`
 *   pattern.
 */

import { ListGroup } from "@stackra/ui/native";
import { useCallback, type ReactElement } from "react";

import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useSettingsNavigation } from "../../hooks/use-settings-navigation/use-settings-navigation.hook";

import type { ITextFieldRowProps } from "./text-field-row.interface";

/**
 * Sentinel string rendered in place of `password` / `sensitive`
 * values so the raw contents never leak into the row.
 */
const SENSITIVE_MASK = "••••••••" as const;

/**
 * `<TextFieldRow>` — tappable row that navigates to the field
 * editor.
 *
 * @param props - {@link ITextFieldRowProps}.
 */
export function TextFieldRow(props: ITextFieldRowProps): ReactElement {
  const { field, groupKey, value, onPress, disabled } = props;
  const isDisabled = disabled === true || field.readOnly === true;
  const nav = useSettingsNavigation();
  const t = useNativeSettingsT();

  // Preview text — sensitive fields get a static mask so the value
  // never surfaces in the row.
  const preview = ((): string => {
    if (field.sensitive === true) {
      return value === null || value === undefined || value === ""
        ? t("text_field.empty_hint")
        : SENSITIVE_MASK;
    }
    if (value === null || value === undefined || value === "") {
      return t("text_field.empty_hint");
    }
    return String(value);
  })();

  const handlePress = useCallback((): void => {
    if (isDisabled) return;
    if (onPress) {
      onPress(groupKey, field.key);
      return;
    }
    nav.goToFieldEditor(groupKey, field.key);
  }, [isDisabled, onPress, nav, groupKey, field.key]);

  return (
    <ListGroup.Item
      accessibilityHint={t("text_field.open_hint")}
      accessibilityLabel={field.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className="min-h-[48px]"
      onPress={handlePress}
    >
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{field.label}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{preview}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}

TextFieldRow.displayName = "TextFieldRow";
