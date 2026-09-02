/**
 * @file widget-preview-type.type.ts
 * @module @stackra/contracts/types/dashboard
 * @description Visual preview kind rendered inside the catalogue
 *   drawer's widget cards. Purely presentational — decides which
 *   preview illustration component the drawer uses to hint at the
 *   widget's shape.
 *
 *   Promoted from `@stackra/dashboard/core/types` on 2026-07-27
 *   alongside `IWidgetMetadata` — the decorator's parameter type
 *   references this union.
 */

/**
 * Preview kind matched against a lookup table in the widget-catalogue
 * drawer:
 *
 *   - `line` / `area` / `bar` / `pie` / `radial` / `radar` /
 *     `composed` — chart primitives.
 *   - `kpi` / `kpi-group` / `stat` — number / trend primitives.
 *   - `list` — activity-list preview.
 *   - `board` — kanban / pipeline preview.
 */
export type WidgetPreviewType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "radial"
  | "radar"
  | "composed"
  | "kpi"
  | "kpi-group"
  | "stat"
  | "list"
  | "board";
