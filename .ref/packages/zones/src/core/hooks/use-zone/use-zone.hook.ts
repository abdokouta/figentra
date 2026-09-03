/**
 * @file use-zone.hook.ts
 * @module @stackra/zones/core/hooks
 * @description `useZone(zoneId, params?)` — read every contribution
 *   currently registered against `zoneId`, filtered through the
 *   `IZoneContext` produced by {@link useZoneContext}.
 *
 *   Returns a stable snapshot — reference-stable across renders
 *   until either the underlying `ZoneRegistry` state OR the context
 *   changes.
 *
 *   The hook does NOT run the ordering algorithm — it just returns
 *   the filtered list. `<Zone>` then intersperses those
 *   contributions with the host's intrinsic children via
 *   `resolveZoneOrder(...)`.
 */

import { useInject } from "@stackra/container/react";
import {
  ZONE_REGISTRY,
  type IZoneContext,
  type IZoneContribution,
  type IZoneRegistry,
} from "@stackra/contracts";
import { useMemo } from "react";

import { useZoneContext } from "../use-zone-context/use-zone-context.hook";

/**
 * Result of {@link useZone} — the caller-visible slice a `<Zone>`
 * renderer consumes.
 */
export interface IUseZoneResult {
  /** The full `IZoneContext` folded from the source provider. */
  readonly context: IZoneContext;
  /**
   * Every contribution registered against the zone, unfiltered by
   * `when(ctx)` — the ordering algorithm applies the filter itself,
   * per design.md §5.2 step 1.
   */
  readonly contributions: readonly IZoneContribution[];
}

/**
 * Read every contribution registered against a zone.
 *
 * @param zoneId - The dotted zone id to read.
 * @param params - Extra params merged into `IZoneContext.params`.
 *   Optional.
 * @returns The zone context + the unfiltered contribution list.
 *
 * @example
 * ```tsx
 * function MyZone() {
 *   const { context, contributions } = useZone("users.list.header");
 *   const ordered = useMemo(
 *     () => resolveZoneOrder(intrinsic, contributions, context),
 *     [intrinsic, contributions, context],
 *   );
 *   // ...
 * }
 * ```
 */
export function useZone(
  zoneId: string,
  params?: Readonly<Record<string, unknown>>,
): IUseZoneResult {
  const registry = useInject<IZoneRegistry>(ZONE_REGISTRY);
  const context = useZoneContext(zoneId, params);

  // The registry's `list()` returns a snapshot — reference-stable
  // for a given zone id until a `register()` / `unregister()` /
  // `clear()` mutation lands. `useZone` snapshots at hook-call time.
  //
  // live list of every contribution), consumers would subscribe
  // through a future `subscribe(listener)` overload on the
  // registry — not built here.
  const contributions = useMemo(
    () => registry.list(zoneId),
    [registry, zoneId],
  );

  return useMemo<IUseZoneResult>(
    () => ({ context, contributions }),
    [context, contributions],
  );
}
