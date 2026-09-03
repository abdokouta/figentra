/**
 * @file table-column-zone.interface.ts
 * @module @stackra/zones/react/components/table-column-zone
 * @description Props interface for `<TableColumnZone>` — the
 *   render-prop wrapper that produces the ordered list of
 *   `IColumnDescriptor`s a host table composes.
 */

import type { IColumnDescriptor } from "@stackra/contracts";
import type { ReactNode } from "react";

/**
 * Props accepted by `<TableColumnZone>`.
 *
 * Same render-prop pattern as `<FormFieldZone>` — the host owns
 * the actual table and receives the ordered column descriptor
 * list.
 *
 * @example
 * ```tsx
 * <TableColumnZone
 *   id="users.list.columns"
 *   intrinsicColumns={[
 *     { id: "name", header: "Name", cell: NameCell },
 *     { id: "email", header: "Email", cell: EmailCell },
 *   ]}
 * >
 *   {(columns) => <DataTable columns={columns} />}
 * </TableColumnZone>
 * ```
 */
export interface ITableColumnZoneProps {
  /** The dotted zone id. */
  readonly id: string;

  /**
   * The host's default column descriptors — the ones that render
   * when no contribution replaces / precedes / follows. Every
   * descriptor's `id` is used as the anchor id.
   */
  readonly intrinsicColumns: readonly IColumnDescriptor[];

  /**
   * Optional params merged into `IZoneContext.params` every
   * contribution's `when(ctx)` sees.
   */
  readonly params?: Readonly<Record<string, unknown>>;

  /**
   * Render prop — receives the ordered final column descriptor
   * list. The host composes the descriptors into a table any way
   * it wants — HeroUI `Table`, Refine `ResourceDataGrid`, bespoke.
   *
   * @param columns - Ordered `IColumnDescriptor` list, filtered by
   *   `when(ctx)` and interspersed with the intrinsic set per
   *   `resolveZoneOrder`.
   */
  readonly children: (columns: readonly IColumnDescriptor[]) => ReactNode;
}
