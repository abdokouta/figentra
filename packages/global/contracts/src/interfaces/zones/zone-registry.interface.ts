/**
 * @file zone-registry.interface.ts
 * @module @stackra/contracts/interfaces/zones
 * @description Public contract for the DI-owned zone registry — the
 *   store every `<Host>Module.forFeature({ zones })` registrar writes
 *   into, and the store every `<Zone>` render call reads from.
 *
 *   Consumers resolve the registry through the {@link ZONE_REGISTRY}
 *   DI token from `@stackra/contracts/tokens`.
 *
 *   Concrete implementation ships in `@stackra/zones/core` as
 *   `ZoneRegistry extends BaseRegistry<string, IZoneContribution[]>`;
 *   this interface names ONLY the surface consumers use through the
 *   DI token so tree-shaking + test-double authoring stay cheap.
 *   Concrete implementations MAY expose additional methods (`entries`,
 *   `keys`, `values`); the contract intentionally names only what
 *   downstream consumers reach through the token.
 */

import type { IZoneContribution } from "./zone-contribution.interface";

/**
 * DI-owned registry every zone contribution lands in — one bucket
 * per `zoneId`.
 *
 * Registration is IDEMPOTENT by `id`: subsequent calls with the
 * same contribution id remove the previous entry from whichever
 * bucket held it and re-append the fresh one (with a `console.warn`
 * fail-soft). This matches the design.md §4 lifecycle contract.
 *
 * @example Read-side consumer (a `<Zone>` render call)
 * ```typescript
 * const registry = useInject<IZoneRegistry>(ZONE_REGISTRY);
 * const contributions = registry.list("users.list.header");
 * ```
 *
 * @example Write-side consumer (a `forFeature` registrar per ADR-0052)
 * ```typescript
 * @Injectable()
 * class UserZoneRegistrar implements OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(ZONE_REGISTRY) private readonly zones: IZoneRegistry,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     for (const contribution of items.zones ?? []) {
 *       this.zones.register(contribution);
 *     }
 *   }
 * }
 * ```
 */
export interface IZoneRegistry {
  /**
   * Register a contribution. Idempotent by `contribution.id`:
   * a re-register removes the previous entry from whichever bucket
   * held it and appends the fresh one. The concrete implementation
   * `console.warn`s once per duplicate id (fail-soft).
   *
   * @param contribution - The contribution to register.
   */
  register(contribution: IZoneContribution): void;

  /**
   * Every contribution targeting `zoneId`, in insertion order.
   *
   * The returned list is UNFILTERED by `when(ctx)` — call
   * `resolveZoneOrder(intrinsic, list, ctx)` from
   * `@stackra/zones/core` to apply the predicate + ordering rules.
   *
   * @param zoneId - The dotted zone id to look up.
   * @returns Immutable snapshot of the bucket. Empty when the zone
   *   has no contributions.
   */
  list(zoneId: string): readonly IZoneContribution[];

  /**
   * @returns Snapshot of every non-empty bucket key.
   */
  zoneIds(): readonly string[];

  /**
   * Remove exactly one contribution by its `id`. Walks every bucket
   * and deletes the matching entry; returns `true` on hit.
   *
   * @param id - The contribution id to remove.
   * @returns `true` when the id was found and removed.
   */
  unregister(id: string): boolean;

  /**
   * Remove every contribution from every bucket. Reserved for
   * testing / hot-reload paths — production registrar code does not
   * call this.
   */
  clear(): void;
}
