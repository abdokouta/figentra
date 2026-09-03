/**
 * @file field-editor-screen.tsx
 * @module @stackra/settings/native/screens/field-editor-screen
 * @description `<FieldEditorScreen>` — full-screen text editor for
 *   complex fields.
 *
 *   Composes HeroUI Native's `TextField` compound
 *   (`TextField > Label + Input + Description + FieldError`) as
 *   verified via MCP `get_component_docs`. The `Input` widget
 *   configures `multiline` + `numberOfLines` based on
 *   `field.control === ControlType.Textarea` and honours
 *   `secureTextEntry` for password fields.
 *
 *   Save flow:
 *   1. User edits the input (local state buffer).
 *   2. User taps Save.
 *   3. Buffer is written back through `setMany({ [fieldKey]: value })`
 *      — the core settings service handles debouncing + persistence.
 *   4. Navigation pops via {@link useSettingsNavigation}'s `back()`.
 *
 *   Consumers who want to short-circuit the save (e.g. run their own
 *   validation) pass an explicit `onSave` — the screen still writes
 *   the buffer to the store, but the pop is left to the consumer.
 */

import { useMemo, useState, type ReactElement } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Description, FieldError, Input, Label, TextField } from "@stackra/ui/native";

import { ControlType, type ISettingDefinition, type ISettingField } from "@stackra/contracts";

import { useSettings } from "../../../core/hooks/use-settings/use-settings.hook";
import { useSettingsSchema } from "../../../core/hooks/use-settings-schema/use-settings-schema.hook";

import { useNativeSettingsConfig } from "../../hooks/use-native-settings-config/use-native-settings-config.hook";
import { useNativeSettingsT } from "../../hooks/use-native-settings-t/use-native-settings-t.hook";
import { useSettingsNavigation } from "../../hooks/use-settings-navigation/use-settings-navigation.hook";
import { useRouteParamOrProp } from "../group-screen/use-route-param-or-prop.util";

import type { IFieldEditorScreenProps } from "./field-editor-screen.interface";

/**
 * Serialise a stored value into a string the `<Input>` can render.
 * Non-string values (numbers) coerce via `String(...)`; `null` /
 * `undefined` collapse to `""` so the input starts empty rather
 * than showing `"null"`.
 */
function toEditableString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // JSON-shaped values (objects, arrays) round-trip through a
  // pretty-printed string — matches the web editor's default.
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

/**
 * Parse the input buffer back into the field's stored type. Errors
 * are surfaced through the `<FieldError>` slot; a failed parse
 * short-circuits the save.
 */
function parseEditableString(
  field: ISettingField,
  raw: string,
): { value: unknown; error: string | null } {
  switch (field.control) {
    case ControlType.Number:
    case ControlType.Slider: {
      const trimmed = raw.trim();
      if (trimmed === "") return { value: null, error: null };
      const num = Number(trimmed);
      if (Number.isNaN(num)) return { value: null, error: "field_editor.errors.invalid_number" };
      return { value: num, error: null };
    }
    case ControlType.Json: {
      const trimmed = raw.trim();
      if (trimmed === "") return { value: null, error: null };
      try {
        return { value: JSON.parse(trimmed) as unknown, error: null };
      } catch {
        return { value: null, error: "field_editor.errors.invalid_json" };
      }
    }
    default:
      return { value: raw, error: null };
  }
}

/**
 * Whether the given control type prefers a multi-line input.
 */
function isMultiline(control: ISettingField["control"]): boolean {
  return (
    control === ControlType.Textarea || control === ControlType.Json || control === ControlType.Code
  );
}

/**
 * `<FieldEditorScreen>` — full-screen field editor.
 *
 * @param props - {@link IFieldEditorScreenProps}.
 */
export function FieldEditorScreen(props: IFieldEditorScreenProps = {}): ReactElement {
  const { onSave } = props;
  const groupKey = useRouteParamOrProp("groupKey", props.groupKey);
  const fieldKey = useRouteParamOrProp("fieldKey", props.fieldKey);

  const { safeAreaEdges } = useNativeSettingsConfig();
  const t = useNativeSettingsT();
  const nav = useSettingsNavigation();
  const groups = useSettingsSchema();

  const definition = useMemo<ISettingDefinition | undefined>(
    () => groups.find((g) => g.key === groupKey),
    [groups, groupKey],
  );
  const field = useMemo<ISettingField | undefined>(
    () => definition?.fields?.find((f) => f.key === fieldKey),
    [definition, fieldKey],
  );

  const { values, setMany } = useSettings<Record<string, unknown>>(definition?.key ?? "");

  // Local editing buffer — initialised from the current stored
  // value. `useState`'s lazy initialiser reads once at mount so the
  // buffer survives re-renders from the settings subscription.
  const [buffer, setBuffer] = useState<string>(() =>
    field ? toEditableString(values[field.key]) : "",
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (!definition || !field) {
    return (
      <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
        <View className="gap-2 p-6">
          <Description>{t("field_editor.not_found_title")}</Description>
          <Description>{t("field_editor.not_found_description")}</Description>
        </View>
      </SafeAreaView>
    );
  }

  const multiline = isMultiline(field.control);
  const isSensitive = field.sensitive === true || field.control === ControlType.Password;

  const handleSave = (): void => {
    const parsed = parseEditableString(field, buffer);
    if (parsed.error !== null) {
      setErrorKey(parsed.error);
      return;
    }
    setErrorKey(null);

    // Persist through the core service — coalesced + debounced per
    // the service's config.
    setMany({ [field.key]: parsed.value });

    if (onSave) {
      onSave(definition.key, field.key, parsed.value);
      return;
    }
    nav.back();
  };

  return (
    <SafeAreaView accessibilityRole="none" className="bg-background flex-1" edges={safeAreaEdges}>
      <View className="flex-1 gap-6 p-4">
        <TextField isInvalid={errorKey !== null} isDisabled={field.readOnly === true}>
          <Label>{field.label}</Label>
          <Input
            accessibilityLabel={field.label}
            keyboardType={
              field.control === ControlType.Email
                ? "email-address"
                : field.control === ControlType.Number || field.control === ControlType.Slider
                  ? "numeric"
                  : field.control === ControlType.Url
                    ? "url"
                    : "default"
            }
            multiline={multiline}
            numberOfLines={multiline ? 6 : undefined}
            onChangeText={setBuffer}
            placeholder={field.placeholder}
            secureTextEntry={isSensitive}
            value={buffer}
          />
          {field.description ? <Description>{field.description}</Description> : null}
          {errorKey !== null ? <FieldError>{t(errorKey)}</FieldError> : null}
        </TextField>

        {/* Footer — Save + Cancel. Save is disabled when the field
            is read-only. */}
        <View className="mt-auto flex-row gap-3">
          <Button
            accessibilityLabel={t("field_editor.cancel_label")}
            className="flex-1"
            onPress={() => nav.back()}
            variant="tertiary"
          >
            <Button.Label>{t("field_editor.cancel_label")}</Button.Label>
          </Button>
          <Button
            accessibilityLabel={t("field_editor.save_label")}
            className="flex-1"
            isDisabled={field.readOnly === true}
            onPress={handleSave}
            variant="primary"
          >
            <Button.Label>{t("field_editor.save_label")}</Button.Label>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

FieldEditorScreen.displayName = "FieldEditorScreen";
