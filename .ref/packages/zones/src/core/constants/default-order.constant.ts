/**
 * @file default-order.constant.ts
 * @module @stackra/zones/core/constants
 * @description Default tiebreaker `order` value used by
 *   `resolveZoneOrder(...)` when a contribution declares no explicit
 *   `order`. Lower renders first within a `(position, anchor)` bucket.
 *   Contributions with equal `order` fall back to registration order
 *   (ES2019 `Array.prototype.sort` is stable).
 *
 *   Value locked at `100` per design.md §5.1. Every consumer that
 *   authors a contribution and DOES declare `order` picks a value
 *   above or below `100` relative to the anchor it wants to be near.
 */

/**
 * The default `order` used when a contribution declares none.
 *
 * @see `resolveZoneOrder` in `../utils/resolve-zone-order.util.ts`.
 */
export const DEFAULT_ORDER = 100;
