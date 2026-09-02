/**
 * @file column-descriptor.interface.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Column-descriptor shape a `<TableColumnZone>` host
 *   consumes to compose a HeroUI `<Table>` (or Refine
 *   `<ResourceDataGrid>`, or any other table-flavored renderer).
 *
 *   Consumed by `IZoneColumnContribution` in
 *   `zone-contribution.interface.ts` and `<TableColumnZone>` in
 *   `@stackra/zones/react` + `@stackra/zones/native`.
 *
 *   Note — this descriptor DOES carry a React component (`cell`), so
 *   an `IZoneColumnContribution` is NOT a wire-safe primitive. Cells
 *   never serialize; the parts that DO cross the wire are `id`,
 *   `header`, `width`, and `sortable`.
 */

import type { IZoneContext } from "./zone-context.interface";
import type { ComponentType } from "react";

/**
 * Table-column descriptor a zone contribution injects into a
 * `<TableColumnZone>` host.
 *
 * @example
 * ```ts
 * const contribution: IZoneColumnContribution = {
 *   id: "user-group-column",
 *   zone: "users.list.columns",
 *   kind: "column",
 *   anchor: "email",
 *   position: "after",
 *   column: {
 *     id: "group",
 *     header: "Group",
 *     cell: UserGroupCell,
 *     width: 120,
 *     sortable: true,
 *   },
 * };
 * ```
 */
export interface IColumnDescriptor {
  /**
   * Stable column id — used as the anchor target for other
   * contributions and as the React key for the rendered column.
   */
  readonly id: string;

  /** Column header text (user-facing). */
  readonly header: string;

  /**
   * The cell renderer component. Receives the row object (host-
   * shape-specific — a `User`, a `Team`, ...) plus the resolved
   * `IZoneContext` so the cell can gate its rendering on
   * permissions or feature flags.
   */
  readonly cell: ComponentType<{
    /**
     * The row the cell renders. Runtime shape is host-specific —
     * `unknown` at the contract level so a contribution author can
     * consume `Row = User` (or whatever) inside the cell body.
     */
    readonly row: unknown;

    /** The zone context resolved at render time. */
    readonly context: IZoneContext;
  }>;

  /** Optional fixed width in pixels. Host clamps to the table's grid. */
  readonly width?: number;

  /**
   * Whether the host should render sort affordances on the column
   * header. The host owns the actual sort machinery — this flag
   * just gates the UI switch.
   */
  readonly sortable?: boolean;
}
