/**
 * @file ordered-item.interface.ts
 * @module @stackra/zones/core/interfaces
 * @description Algorithm-internal shape describing one item in the
 *   result of `resolveZoneOrder(...)` — the ordered mix of intrinsic
 *   children AND cross-module contributions the renderer walks in
 *   left-to-right order.
 *
 *   NOT promoted to `@stackra/contracts` — this is a private output
 *   shape used only by the ordering algorithm and the React /
 *   native renderers. Consumers see the rendered output; they do
 *   not consume `OrderedItem` directly.
 */

import type { IZoneContribution } from "@stackra/contracts";

import type { IntrinsicChild } from "./intrinsic-child.interface";

/**
 * One item in the final ordered list returned by `resolveZoneOrder`.
 *
 * `kind` discriminates:
 *
 * - `"intrinsic"` — the host's original child at its resolved
 *   position (accounting for `before` / `after` contributions on
 *   either side, and NOT replaced by any `replace` contribution).
 * - `"contribution"` — a cross-module contribution the runtime
 *   resolves through the `<Zone>` renderer (React component,
 *   SDUI subtree, or `null` for `"field"` / `"column"` which are
 *   only meaningful inside `<FormFieldZone>` / `<TableColumnZone>`).
 */
export type OrderedItem =
  | {
      /** Discriminant — an intrinsic host child. */
      readonly kind: "intrinsic";
      /** The intrinsic child the renderer mounts at this slot. */
      readonly child: IntrinsicChild;
    }
  | {
      /** Discriminant — a cross-module contribution. */
      readonly kind: "contribution";
      /** The contribution the renderer mounts at this slot. */
      readonly contribution: IZoneContribution;
    };
