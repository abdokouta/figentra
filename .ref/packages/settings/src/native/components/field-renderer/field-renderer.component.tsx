/**
 * @file field-renderer.component.tsx
 * @module @stackra/settings/native/components/field-renderer
 * @description `<FieldRenderer>` — dispatches over `field.control`
 *   to the correct row component.
 *
 *   The renderer is the SEAM between the schema-driven settings
 *   surface and the concrete native rows. Consumers who want a
 *   bespoke row for a specific `control` type wrap this component
 *   and short-circuit before falling through to it.
 *
 *   Dispatch table:
 *   - {@link ControlType.Toggle} → {@link BooleanFieldRow}
 *   - {@link ControlType.Select} → {@link SelectFieldRow}
 *   - {@link ControlType.Radio} / {@link ControlType.Segment} →
 *     {@link SelectFieldRow} (same picker pattern on native)
 *   - {@link ControlType.Text} / {@link ControlType.Textarea} /
 *     {@link ControlType.Url} / {@link ControlType.Email} /
 *     {@link ControlType.Password} / {@link ControlType.Number} /
 *     {@link ControlType.Json} / {@link ControlType.Code} →
 *     {@link TextFieldRow} — every "free text" field opens the
 *     field-editor screen.
 *   - Every unknown control type → {@link TextFieldRow} as a
 *     conservative fallback so a schema update never sinks the
 *     surface.
 */

import { useMemo, type ReactElement } from "react";

import { ControlType, type ISettingFieldOption } from "@stackra/contracts";

import { BooleanFieldRow } from "../boolean-field-row/boolean-field-row.component";
import { SelectFieldRow } from "../select-field-row/select-field-row.component";
import { TextFieldRow } from "../text-field-row/text-field-row.component";

import type { IFieldRendererProps } from "./field-renderer.interface";

/**
 * `<FieldRenderer>` — dispatches to a concrete native row.
 *
 * @param props - {@link IFieldRendererProps}.
 *
 * @example
 * ```tsx
 * <FieldRenderer
 *   field={field}
 *   groupKey="display"
 *   value={values[field.key]}
 *   onChange={(next) => set(field.key as keyof T & string, next)}
 * />
 * ```
 */
export function FieldRenderer(props: IFieldRendererProps): ReactElement {
  const { field, groupKey, value, onChange, disabled } = props;

  // Resolve static options once — dynamic `optionsProvider` isn't
  // handled here; callers wanting async options wrap the renderer
  // and resolve options themselves upstream.
  const options = useMemo<readonly ISettingFieldOption[]>(
    () => field.options ?? [],
    [field.options],
  );

  switch (field.control) {
    // ── Boolean ────────────────────────────────────────────────────
    case ControlType.Toggle:
      return (
        <BooleanFieldRow
          disabled={disabled}
          field={field}
          onChange={(next) => onChange(next)}
          value={Boolean(value)}
        />
      );

    // ── Single-choice pickers ─────────────────────────────────────
    case ControlType.Select:
    case ControlType.Radio:
    case ControlType.Segment:
    case ControlType.Timezone:
    case ControlType.Locale:
    case ControlType.Currency:
    case ControlType.Font:
      return (
        <SelectFieldRow
          disabled={disabled}
          field={field}
          onChange={(next) => onChange(next)}
          options={options}
          value={value as string | number | boolean | null}
        />
      );

    // ── Free-text (opens field-editor) ────────────────────────────
    case ControlType.Text:
    case ControlType.Textarea:
    case ControlType.Url:
    case ControlType.Email:
    case ControlType.Password:
    case ControlType.Number:
    case ControlType.Slider:
    case ControlType.Json:
    case ControlType.Code:
    case ControlType.Color:
    case ControlType.CssValue:
    case ControlType.Date:
    case ControlType.Time:
    case ControlType.Datetime:
    case ControlType.Cron:
    case ControlType.Icon:
    case ControlType.Tags:
    case ControlType.List:
    case ControlType.KeyValue:
    case ControlType.Multiselect:
    case ControlType.File:
    case ControlType.Attachment:
    case ControlType.Map:
      return (
        <TextFieldRow
          disabled={disabled}
          field={field}
          groupKey={groupKey}
          value={value as string | number | null}
        />
      );

    // ── Unknown / bespoke control ─────────────────────────────────
    // Fall through to the text-field row + navigate to the field
    // editor. Consumers who ship a bespoke control register a wrapper
    // upstream to handle it BEFORE the dispatch reaches this branch.
    default:
      return (
        <TextFieldRow
          disabled={disabled}
          field={field}
          groupKey={groupKey}
          value={value as string | number | null}
        />
      );
  }
}

FieldRenderer.displayName = "FieldRenderer";
