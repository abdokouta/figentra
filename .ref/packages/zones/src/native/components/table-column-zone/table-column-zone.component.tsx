/**
 * @file table-column-zone.component.tsx
 * @module @stackra/zones/native/components/table-column-zone
 * @description Native mirror of `<TableColumnZone>` — same
 *   render-prop contract as the web version.
 */

import { useMemo, type ReactElement, type ReactNode } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";

import type { IntrinsicChild } from "../../../core/interfaces";
import type { IColumnDescriptor, IZoneContribution } from "@stackra/contracts";

import { resolveZoneOrder } from "../../../core/utils";

/**
 * Props accepted by the native `<TableColumnZone>`.
 */
export interface ITableColumnZoneProps {
  readonly id: string;
  readonly intrinsicColumns: readonly IColumnDescriptor[];
  readonly params?: Readonly<Record<string, unknown>>;
  readonly children: (columns: readonly IColumnDescriptor[]) => ReactNode;
}

function toIntrinsic(
  columns: readonly IColumnDescriptor[],
): readonly (IntrinsicChild & { readonly kind: "react" })[] {
  return columns.map((column) => ({
    kind: "react" as const,
    id: column.id,
    node: null,
  }));
}

function extractColumnList(
  ordered: readonly {
    readonly kind: "intrinsic" | "contribution";
    readonly child?: IntrinsicChild;
    readonly contribution?: IZoneContribution;
  }[],
  intrinsicColumns: readonly IColumnDescriptor[],
  zoneId: string,
): readonly IColumnDescriptor[] {
  const intrinsicById = new Map(
    intrinsicColumns.map((c) => [c.id, c] as const),
  );
  const out: IColumnDescriptor[] = [];
  const seenWarnings = new Set<string>();

  for (const item of ordered) {
    if (item.kind === "intrinsic" && item.child) {
      const intrinsic = intrinsicById.get(item.child.id);
      if (intrinsic) out.push(intrinsic);
      continue;
    }
    if (item.kind === "contribution" && item.contribution) {
      if (item.contribution.kind === "column") {
        out.push(item.contribution.column);
        continue;
      }
      const dedupKey = `wrong-kind:${zoneId}:${item.contribution.id}:${item.contribution.kind}`;
      if (!seenWarnings.has(dedupKey)) {
        seenWarnings.add(dedupKey);

        console.warn(
          `[@stackra/zones] contribution "${item.contribution.id}" is kind ` +
            `"${item.contribution.kind}" but is registered against ` +
            `<TableColumnZone id="${zoneId}"> — the render pass drops ` +
            `non-"column" contributions.`,
        );
      }
    }
  }

  return out;
}

/**
 * Native `<TableColumnZone>` — produce the ordered column descriptor
 * list for a host-owned table.
 */
export function TableColumnZone({
  id,
  intrinsicColumns,
  params,
  children,
}: ITableColumnZoneProps): ReactElement {
  const { context, contributions } = useZone(id, params);
  const intrinsic = useMemo(
    () => toIntrinsic(intrinsicColumns),
    [intrinsicColumns],
  );
  const ordered = useMemo(
    () => resolveZoneOrder(intrinsic, contributions, context),
    [intrinsic, contributions, context],
  );
  const columns = useMemo(
    () => extractColumnList(ordered, intrinsicColumns, id),
    [ordered, intrinsicColumns, id],
  );

  return <>{children(columns)}</>;
}

TableColumnZone.displayName = "TableColumnZone";
