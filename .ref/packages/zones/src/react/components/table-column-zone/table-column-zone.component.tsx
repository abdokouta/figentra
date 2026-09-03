/**
 * @file table-column-zone.component.tsx
 * @module @stackra/zones/react/components/table-column-zone
 * @description `<TableColumnZone>` — render-prop wrapper that
 *   produces the ordered list of `IColumnDescriptor`s a host table
 *   composes.
 *
 *   Mirrors `<FormFieldZone>`'s shape — reads every
 *   `IZoneColumnContribution` targeting the zone id, drops other
 *   kinds with a warn-once, and hands the ordered list to the
 *   caller via a render-prop.
 */

import { useMemo, type ReactElement } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";

import type { ITableColumnZoneProps } from "./table-column-zone.interface";
import type { IntrinsicChild } from "../../../core/interfaces";
import type { IColumnDescriptor, IZoneContribution } from "@stackra/contracts";

import { resolveZoneOrder } from "../../../core/utils";

/**
 * Adapt intrinsic column descriptors into `IntrinsicChild` records
 * so `resolveZoneOrder` can order them alongside contributions.
 */
function toIntrinsic(
  columns: readonly IColumnDescriptor[],
): readonly (IntrinsicChild & { readonly kind: "react" })[] {
  return columns.map((column) => ({
    kind: "react" as const,
    id: column.id,
    node: null,
  }));
}

/**
 * Extract the ordered `IColumnDescriptor` list from the algorithm's
 * output. Drops non-`column` contributions with a warn-once
 * dedup'd by contribution id.
 */
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
            `non-"column" contributions. Move to a general <Zone> if the ` +
            `intent is to render UI adjacent to the table.`,
        );
      }
    }
  }

  return out;
}

/**
 * `<TableColumnZone>` — produce the ordered column descriptor list.
 *
 * @example
 * ```tsx
 * import { TableColumnZone } from "@stackra/zones/react";
 *
 * <TableColumnZone
 *   id="users.list.columns"
 *   intrinsicColumns={[
 *     { id: "name", header: "Name", cell: NameCell },
 *   ]}
 * >
 *   {(columns) => <DataTable columns={columns} />}
 * </TableColumnZone>
 * ```
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
