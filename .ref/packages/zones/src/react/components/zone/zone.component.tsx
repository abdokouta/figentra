/**
 * @file zone.component.tsx
 * @module @stackra/zones/react/components/zone
 * @description `<Zone>` — the general-purpose zone renderer.
 *
 *   Composes intrinsic host children with cross-module
 *   contributions via `resolveZoneOrder(...)`. Renders a React
 *   fragment (no wrapping element) so the host controls layout —
 *   flex / grid / any wrapper — around the zone.
 *
 *   Cross-platform: this file uses only `react` primitives (no DOM,
 *   no React-Native imports), so the native mirror can re-export
 *   the file's shape unchanged with a native `renderContribution`
 *   swap. Currently the native subpath ships its own version because
 *   the SDUI native runtime resolves through a different module
 *   path.
 */

import { Fragment, useMemo, type ReactElement } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";
import { renderContribution } from "../../utils/render-contribution.util";

import type { IZoneProps } from "./zone.interface";

import {
  flattenIntrinsicChildren,
  resolveZoneOrder,
} from "../../../core/utils";

/**
 * `<Zone>` — the general-purpose zone renderer.
 *
 * Returns `null` when the resolved order is empty — i.e. when the
 * host passed no intrinsic children AND no contributions are
 * registered against the zone. See `.kiro/steering/zones-catalog.md`
 * §Rule 7 — a fully-empty zone must not emit any DOM structure so
 * downstream layout wrappers (`<Navbar.Content>`, sidebar rails,
 * dashboard grids) don't reserve space for something that never
 * renders.
 *
 * @example
 * ```tsx
 * import { Zone } from "@stackra/zones/react";
 *
 * function UsersListPage() {
 *   return (
 *     <Zone id="users.list.header">
 *       <SearchInput id="search" />
 *       <ExportButton id="export" />
 *     </Zone>
 *   );
 * }
 * ```
 */
export function Zone({
  id,
  params,
  children,
}: IZoneProps): ReactElement | null {
  // Read the contribution list + context via the DI-owned hook —
  // one `useZone` call so registry + context stay in lockstep.
  const { context, contributions } = useZone(id, params);

  // Flatten React children into `IntrinsicChild` records. Memoised
  // against `children` identity — the caller passes a stable JSX
  // tree per render unless the host page's state actually changed.
  const intrinsic = useMemo(
    () => flattenIntrinsicChildren(children, id),
    [children, id],
  );

  // Run the pure ordering algorithm. Memoised against the three
  // inputs so a re-render with unchanged data reuses the previous
  // ordered array by reference.
  const ordered = useMemo(
    () => resolveZoneOrder(intrinsic, contributions, context),
    [intrinsic, contributions, context],
  );

  // Empty-zone guard — Phase-D a11y audit §P2.3. When the resolved
  // order is empty (no intrinsic children AND no contributions),
  // return `null` rather than an empty React fragment. Both render
  // no DOM at Zone's level, but returning `null` is the clearer
  // semantic signal for downstream consumers (React DevTools,
  // testing-library `.container.firstChild`, layout wrappers that
  // inspect their own children to decide whether to render at
  // all). Also flips this function's return type to
  // `ReactElement | null` so TypeScript surfaces the empty branch
  // to every caller.
  if (ordered.length === 0) return null;

  return (
    <>
      {ordered.map((item) => {
        if (item.kind === "intrinsic") {
          // Intrinsic children come from the host's default content.
          // Two arms: `"react"` (a React node authored by the app)
          // renders as-is via a `<Fragment>`; `"sdui"` (a wire-format
          // `ISduiNode` arriving from an SDUI schema's `intrinsic`
          // slot — design.md §8.3) is routed through the same SDUI
          // renderer path as contributions, by synthesising a minimal
          // synthetic contribution around the intrinsic node. The
          // synthetic id namespace (`intrinsic-sdui-<child-id>`)
          // guarantees uniqueness against real contribution ids.
          if (item.child.kind === "react") {
            return <Fragment key={item.child.id}>{item.child.node}</Fragment>;
          }
          return renderContribution(
            {
              id: `intrinsic-sdui-${item.child.id}`,
              zone: context.zoneId,
              kind: "sdui",
              node: item.child.node,
            },
            context,
          );
        }
        // Contribution — delegate to the shared renderer. It picks
        // the right path per `kind` and returns `null` for
        // non-general kinds (field / column) which don't belong
        // here.
        return renderContribution(item.contribution, context);
      })}
    </>
  );
}

Zone.displayName = "Zone";
