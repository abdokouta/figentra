/**
 * @file zone-context-source.context.ts
 * @module @stackra/zones/core/contexts
 * @description React context that carries the caller-supplied
 *   permissions + features + tenant signals `useZoneContext(...)`
 *   folds into every `IZoneContext`.
 *
 *   Kept OPTIONAL — a consumer app that has no `<ZoneContextSourceProvider>`
 *   mounted at the tree root still gets a working zones runtime;
 *   every contribution's `when(ctx)` predicate simply sees empty
 *   permissions / features arrays and an `undefined` tenant.
 *
 *   Consumers wire this from ONE place in their app (typically
 *   inside their auth provider) — the source of truth then flows
 *   into every `<Zone>` render without any per-zone plumbing.
 */

import { createContext } from "react";

/**
 * Shape a `<ZoneContextSourceProvider>` publishes to the tree.
 *
 * Every field is optional so a consumer app can wire only the
 * signals it has available.
 */
export interface IZoneContextSource {
  /**
   * Permissions the current user holds. Defaults to `[]` when the
   * provider omits the field.
   */
  readonly permissions?: readonly string[];

  /**
   * Feature keys entitled to the current tenant. Defaults to `[]`
   * when the provider omits the field.
   */
  readonly features?: readonly string[];

  /**
   * The current tenant record (id, slug, plan, capabilities).
   * Read-only view — `undefined` when no tenant is active or on
   * central / marketing surfaces that have no tenant.
   */
  readonly tenant?: Readonly<Record<string, unknown>>;
}

/**
 * The zone-context source React context. `null` default means no
 * `<ZoneContextSourceProvider>` was mounted — `useZoneContext(...)`
 * treats a `null` value the same as an empty provider.
 */
export const ZoneContextSourceContext =
  createContext<IZoneContextSource | null>(null);
