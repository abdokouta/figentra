/**
 * @file zone-position.type.ts
 * @module @stackra/contracts/interfaces/zones
 * @description The insertion-position discriminant used by every
 *   `IZoneContribution` — decides where a contribution lands
 *   relative to its anchor (or at the head/tail of the zone).
 *
 *   Consumed by `resolveZoneOrder(...)` in `@stackra/zones/core` +
 *   the `<Zone>`, `<FormFieldZone>`, `<TableColumnZone>` renderers
 *   in `@stackra/zones/react` and `@stackra/zones/native`.
 */

/**
 * Insertion position of a zone contribution relative to its anchor.
 *
 * - `"before"` — render immediately before the anchor child.
 * - `"after"` — render immediately after the anchor child.
 * - `"replace"` — replace the anchor child (first-wins within the
 *   `(anchor, replace)` bucket; subsequent replaces on the same anchor
 *   warn once and fall through to `"end"`).
 * - `"start"` — prepend at the head of the zone; `anchor` ignored.
 * - `"end"` — append at the tail of the zone; `anchor` ignored.
 *   This is the default when a contribution declares no `position`.
 */
export type ZonePosition = "before" | "after" | "replace" | "start" | "end";
