/**
 * @file form-field-zone.component.tsx
 * @module @stackra/zones/native/components/form-field-zone
 * @description Native mirror of `<FormFieldZone>` — same render-prop
 *   contract as the web version. The descriptor payload is pure
 *   data (`IFieldDescriptor`), so the RN version is
 *   byte-identical to the web logic minus the JSX return.
 */

import { useMemo, type ReactElement, type ReactNode } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";

import type { IntrinsicChild } from "../../../core/interfaces";
import type { IFieldDescriptor, IZoneContribution } from "@stackra/contracts";

import { resolveZoneOrder } from "../../../core/utils";

/**
 * Props accepted by the native `<FormFieldZone>`.
 */
export interface IFormFieldZoneProps {
  readonly id: string;
  readonly intrinsicFields: readonly IFieldDescriptor[];
  readonly params?: Readonly<Record<string, unknown>>;
  readonly children: (fields: readonly IFieldDescriptor[]) => ReactNode;
}

function toIntrinsic(
  fields: readonly IFieldDescriptor[],
): readonly (IntrinsicChild & { readonly kind: "react" })[] {
  return fields.map((field) => ({
    kind: "react" as const,
    id: field.name,
    node: null,
  }));
}

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
      const dedupKey = `wrong-kind:${zoneId}:${item.contribution.id}:${item.contribution.kind}`;
      if (!seenWarnings.has(dedupKey)) {
        seenWarnings.add(dedupKey);

        console.warn(
          `[@stackra/zones] contribution "${item.contribution.id}" is kind ` +
            `"${item.contribution.kind}" but is registered against ` +
            `<FormFieldZone id="${zoneId}"> — the render pass drops ` +
            `non-"field" contributions.`,
        );
      }
    }
  }

  return out;
}

/**
 * Native `<FormFieldZone>` — produce the ordered field descriptor
 * list for a host-owned form.
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

  return <>{children(fields)}</>;
}

FormFieldZone.displayName = "FormFieldZone";
