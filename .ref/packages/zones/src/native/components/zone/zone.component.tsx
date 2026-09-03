/**
 * @file zone.component.tsx
 * @module @stackra/zones/native/components/zone
 * @description Native mirror of `<Zone>` — same shape as the web
 *   component, imports the native `renderContribution` helper.
 */

import { Fragment, useMemo, type ReactElement, type ReactNode } from "react";

import { useZone } from "../../../core/hooks/use-zone/use-zone.hook";
import { renderContribution } from "../../utils/render-contribution.util";

import {
  flattenIntrinsicChildren,
  resolveZoneOrder,
} from "../../../core/utils";

/**
 * Props accepted by the native `<Zone>` — matches the web shape 1:1.
 */
export interface IZoneProps {
  readonly id: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly children?: ReactNode;
}

/**
 * Native `<Zone>` — renders a React fragment. Layout is the host's
 * responsibility (RN doesn't have a default block-layout container
 * the way the web has `<div>`).
 */
export function Zone({ id, params, children }: IZoneProps): ReactElement {
  const { context, contributions } = useZone(id, params);

  const intrinsic = useMemo(
    () => flattenIntrinsicChildren(children, id),
    [children, id],
  );

  const ordered = useMemo(
    () => resolveZoneOrder(intrinsic, contributions, context),
    [intrinsic, contributions, context],
  );

  return (
    <>
      {ordered.map((item) => {
        if (item.kind === "intrinsic") {
          // Same split as web (see the web `<Zone>` for the full
          // rationale) — SDUI-kind intrinsics route through the
          // shared renderer by synthesising a synthetic contribution.
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
        return renderContribution(item.contribution, context);
      })}
    </>
  );
}

Zone.displayName = "Zone";
