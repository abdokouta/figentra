/**
 * @file intrinsic-child.interface.ts
 * @module @stackra/zones/core/interfaces
 * @description Algorithm-internal shape describing one intrinsic child
 *   of a `<Zone>` — a child that the HOST page authored and handed to
 *   `<Zone>` (or an SDUI `intrinsic` slot).
 *
 *   `resolveZoneOrder(intrinsic, contributions, ctx)` takes an array
 *   of these — each carrying a stable `id` other contributions can
 *   anchor against, and a discriminated `kind` telling the renderer
 *   how to mount the child (`"react"` → plain React node,
 *   `"sdui"` → hand to `<SduiNodeView>`).
 *
 *   NOT promoted to `@stackra/contracts` — this is a private input
 *   shape used only by the ordering algorithm and the React /
 *   native renderers. Consumers author intrinsic children as
 *   ordinary React elements or SDUI nodes; the runtime turns them
 *   into this shape internally.
 */

import type { ReactNode } from "react";
import type { ISduiNode } from "@stackra/contracts";

/**
 * One intrinsic child of a `<Zone>`, tagged by which rendering path
 * the runtime uses.
 *
 * `id` is required — anchor lookups (`position: "before"|"after"|
 * "replace"`) reference intrinsic children by this id. The React
 * renderer derives it from `props.id` OR from `key`; the SDUI
 * runtime derives it from `ISduiNode.id`.
 */
export type IntrinsicChild =
  | {
      /** Discriminant — plain React element. */
      readonly kind: "react";
      /** Stable id — anchor target for other contributions. */
      readonly id: string;
      /** The React node to render. */
      readonly node: ReactNode;
    }
  | {
      /** Discriminant — SDUI-subtree child. */
      readonly kind: "sdui";
      /** Stable id — mirrors `ISduiNode.id`. */
      readonly id: string;
      /** The SDUI wire node to hand to `<SduiNodeView>`. */
      readonly node: ISduiNode;
    };
