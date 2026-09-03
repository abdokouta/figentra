/**
 * @file use-zone-context.hook.ts
 * @module @stackra/zones/core/hooks
 * @description `useZoneContext(zoneId, params?)` — build the
 *   `IZoneContext` every contribution's `when(ctx)` predicate
 *   sees and every `IZoneReactContribution.component` receives.
 *
 *   Reads permissions / features / tenant from the optional
 *   `<ZoneContextSourceProvider>` at the app root. Missing provider
 *   ⇒ empty permissions + features + `undefined` tenant — the
 *   zone system runs stand-alone without any auth / feature-flag
 *   / tenancy peer installed.
 *
 *   The returned context is memoised — reference-stable across
 *   renders unless a source signal or the caller's `params`
 *   changes. Downstream `useMemo(() => resolveZoneOrder(...), [ctx])`
 *   stays hot.
 */

import { useContext, useMemo } from "react";

import { ZoneContextSourceContext } from "../../contexts/zone-context-source.context";

import type { IZoneContext } from "@stackra/contracts";

/**
 * Frozen empty array — reused so downstream `useMemo` deps stay
 * reference-stable when the consumer app has no
 * `<ZoneContextSourceProvider>` mounted OR the provider omits the
 * field.
 */
const EMPTY: readonly string[] = Object.freeze([]);

/**
 * Frozen empty params — same rationale as {@link EMPTY} for the
 * caller-omitted-`params` path.
 */
const EMPTY_PARAMS: Readonly<Record<string, unknown>> = Object.freeze({});

/**
 * Build the `IZoneContext` for a given zone at render time.
 *
 * @param zoneId - The zone id being resolved. Feeds
 *   `IZoneContext.zoneId` unchanged.
 * @param params - Route params + host-supplied extras merged into
 *   `IZoneContext.params`. Optional — defaults to the shared
 *   frozen empty object.
 * @returns The composed `IZoneContext`.
 *
 * @example
 * ```tsx
 * function MyZone() {
 *   const ctx = useZoneContext("users.list.header");
 *   const contributions = useZone("users.list.header");
 *   const ordered = useMemo(
 *     () => resolveZoneOrder(intrinsic, contributions, ctx),
 *     [contributions, ctx],
 *   );
 *   // ...
 * }
 * ```
 */
export function useZoneContext(
  zoneId: string,
  params: Readonly<Record<string, unknown>> = EMPTY_PARAMS,
): IZoneContext {
  const source = useContext(ZoneContextSourceContext);

  return useMemo<IZoneContext>(
    () => ({
      zoneId,
      permissions: source?.permissions ?? EMPTY,
      features: source?.features ?? EMPTY,
      params,
      // `tenant` is `undefined | Readonly<Record<string, unknown>>`
      // in the contract — spread only when present so the field is
      // absent in the runtime object when there's no tenant.
      ...(source?.tenant !== undefined ? { tenant: source.tenant } : {}),
    }),
    [zoneId, source, params],
  );
}
