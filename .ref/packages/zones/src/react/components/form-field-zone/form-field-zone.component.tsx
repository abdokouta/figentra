/**
 * @file form-field-zone.component.tsx
 * @module @stackra/zones/react/components/form-field-zone
 * @description `<FormFieldZone>` — render-prop wrapper that produces
 *   the ordered list of `IFieldDescriptor`s a host form composes.
 *
 *   Reads every `IZoneFieldContribution` targeting the zone id
 *   (contributions of other kinds are silently dropped — those
 *   don't belong in a form-field zone). Filters through the
 *   ordering algorithm using each descriptor's `name` as its
 *   anchor id, then hands the ordered list to the caller via the
 *   render-prop `children`.
 */

import { useMemo, type ReactElement } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";

import type { IFormFieldZoneProps } from "./form-field-zone.interface";
import type { IntrinsicChild } from "../../../core/interfaces";
import type { IFieldDescriptor, IZoneContribution } from "@stackra/contracts";

import { resolveZoneOrder } from "../../../core/utils";

/**
 * A minimal wrapper node — `<FormFieldZone>` intrinsic children
 * aren't React elements, they're `IFieldDescriptor`s. The
 * ordering algorithm expects `IntrinsicChild` records with a
 * `kind` discriminant + `id`, so we adapt each descriptor into a
 * `"react"` child whose `node` is a placeholder we never render.
 * Consumers see only the final `IFieldDescriptor[]`.
 */
type IntrinsicFieldRecord = IntrinsicChild & { readonly kind: "react" };

function toIntrinsic(
  fields: readonly IFieldDescriptor[],
): readonly IntrinsicFieldRecord[] {
  return fields.map((field) => ({
    kind: "react" as const,
    id: field.name,
    // `node` is never rendered — the caller only sees the
    // extracted `IFieldDescriptor` array. Value is `null` for
    // clarity in the debugger.
    node: null,
  }));
}

/**
 * Extract the ordered `IFieldDescriptor` list from the algorithm's
 * output. Drops non-`field` contributions (a warning fires once
 * per unique offender, similar to `renderContribution`'s
 * out-of-place path).
 */
function extractFieldList(
  ordered: readonly {
    readonly kind: "intrinsic" | "contribution";
    readonly child?: IntrinsicChild;
    readonly contribution?: IZoneContribution;
  }[],
  intrinsicFields: readonly IFieldDescriptor[],
  zoneId: string,
): readonly IFieldDescriptor[] {
  const intrinsicByName = new Map(
    intrinsicFields.map((f) => [f.name, f] as const),
  );
  const out: IFieldDescriptor[] = [];
  const seenWarnings = new Set<string>();

  for (const item of ordered) {
    if (item.kind === "intrinsic" && item.child) {
      const intrinsic = intrinsicByName.get(item.child.id);
      if (intrinsic) out.push(intrinsic);
      continue;
    }
    if (item.kind === "contribution" && item.contribution) {
      if (item.contribution.kind === "field") {
        out.push(item.contribution.field);
        continue;
      }
      // Off-kind contribution registered against a form-field
      // zone — warn once per unique id.
      const dedupKey = `wrong-kind:${zoneId}:${item.contribution.id}:${item.contribution.kind}`;
      if (!seenWarnings.has(dedupKey)) {
        seenWarnings.add(dedupKey);

        console.warn(
          `[@stackra/zones] contribution "${item.contribution.id}" is kind ` +
            `"${item.contribution.kind}" but is registered against ` +
            `<FormFieldZone id="${zoneId}"> — the render pass drops ` +
            `non-"field" contributions. Move to a general <Zone> if the ` +
            `intent is to render UI adjacent to the form fields.`,
        );
      }
    }
  }

  return out;
}

/**
 * `<FormFieldZone>` — produce the ordered form-field descriptor
 * list.
 *
 * @example
 * ```tsx
 * import { FormFieldZone } from "@stackra/zones/react";
 *
 * <FormFieldZone
 *   id="user.create.form"
 *   intrinsicFields={[
 *     { name: "email", label: "Email", kind: "email", required: true },
 *   ]}
 * >
 *   {(fields) => <MyForm descriptors={fields} />}
 * </FormFieldZone>
 * ```
 */
export function FormFieldZone({
  id,
  intrinsicFields,
  params,
  children,
}: IFormFieldZoneProps): ReactElement {
  const { context, contributions } = useZone(id, params);

  const intrinsic = useMemo(
    () => toIntrinsic(intrinsicFields),
    [intrinsicFields],
  );

  const ordered = useMemo(
    () => resolveZoneOrder(intrinsic, contributions, context),
    [intrinsic, contributions, context],
  );

  const fields = useMemo(
    () => extractFieldList(ordered, intrinsicFields, id),
    [ordered, intrinsicFields, id],
  );

  // The render-prop hands the caller the ordered list. Wrapping
  // in a Fragment keeps the JSX-level typing tidy — the caller's
  // returned `ReactNode` renders directly.
  return <>{children(fields)}</>;
}

FormFieldZone.displayName = "FormFieldZone";
