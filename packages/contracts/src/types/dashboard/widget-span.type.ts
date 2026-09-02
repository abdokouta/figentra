/**
 * @file widget-span.type.ts
 * @module @stackra/contracts/types/dashboard
 * @description Grid-column span a widget occupies in the dashboard
 *   layout. Mapped to Tailwind column-span utilities by
 *   `SPAN_TO_CLASS` in `@stackra/dashboard/core/constants/`.
 *
 *   Promoted from `@stackra/dashboard/core/types` on 2026-07-27
 *   alongside `IWidgetMetadata` — the decorator's parameter type
 *   references this union.
 */

/**
 * How many grid columns a widget spans at the `lg` breakpoint:
 *
 *   - `third` — 4 of 12 columns (three widgets per row).
 *   - `half`  — 6 of 12 columns (two widgets per row).
 *   - `full`  — 12 of 12 columns (one widget per row).
 *
 * Smaller breakpoints collapse to a single column regardless of the
 * span value.
 */
export type WidgetSpan = "third" | "half" | "full";
