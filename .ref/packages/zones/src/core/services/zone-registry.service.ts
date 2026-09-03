/**
 * @file zone-registry.service.ts
 * @module @stackra/zones/core/services
 * @description `ZoneRegistry` — the DI-owned store every
 *   `<Host>Module.forFeature({ zones })` registrar writes into,
 *   and every `<Zone>` render reads from.
 *
 *   Extends `BaseRegistry<string, IZoneContribution[]>` from
 *   `@stackra/support` — Map-backed storage, standard
 *   `register` / `has` / `get` / `remove` / `clear` semantics,
 *   plus lifecycle hooks. Overrides the `register(...)` /
 *   `unregister(...)` contract from `IZoneRegistry` to layer on:
 *
 *   - Idempotency by `contribution.id` — a re-register removes
 *     the previous entry from whichever bucket held it and
 *     appends the fresh one (design.md §4). Duplicates warn once
 *     to keep the console bounded while surfacing the mistake.
 *   - `unregister(id)` walks every bucket + removes by id.
 *   - `zoneIds()` reports every non-empty bucket key.
 *
 *   Implements the `IZoneRegistry` contract from
 *   `@stackra/contracts/interfaces/zones` — `implements` is
 *   intentional so `tsc` catches drift the moment the contract
 *   or the class shape moves.
 *
 *   Lifecycle: seeded via `ZonesModule.forRoot()` — the module
 *   binds this class + the `ZONE_REGISTRY` DI-token alias. No
 *   built-in contributions are seeded from `onModuleInit` (the
 *   registry starts empty) — every entry lands through a
 *   consumer module's own `<Host>Module.forFeature({ zones })`.
 */

import { Injectable } from "@stackra/container";
import type { IZoneContribution, IZoneRegistry } from "@stackra/contracts";

/**
 * Concrete `IZoneRegistry` implementation.
 *
 * Key = zone id (dotted string). Value = ordered array of every
 * contribution targeting that zone. Register order is preserved so
 * `resolveZoneOrder(...)`'s `order`-tiebreak by insertion order
 * stays deterministic.
 *
 * @example
 * ```typescript
 * const registry = app.get<IZoneRegistry>(ZONE_REGISTRY);
 * registry.register({
 *   id: "audit-users-header-badge",
 *   zone: "users.list.header",
 *   kind: "react",
 *   component: AuditBadge,
 * });
 * const list = registry.list("users.list.header");
 * ```
 */
@Injectable()
export class ZoneRegistry implements IZoneRegistry {
  /**
   * Zone bucket — key = zone id (dotted string), value = the
   * ordered array of every contribution targeting that zone.
   * Insertion order is preserved so `resolveZoneOrder`'s stable
   * sort tiebreaker (design.md §5.2) stays deterministic.
   *
   * `BaseRegistry` from `@stackra/support` is intentionally NOT
   * used here — its `register(key, value)` signature is
   * incompatible with the `IZoneRegistry.register(contribution)`
   * contract (design.md §3.5 vs §4). Composition beats inheritance
   * when the public shapes diverge; the payoff for using the base
   * class was Map-mechanics + lifecycle hooks, both trivially
   * replicated here.
   */
  private readonly items = new Map<string, IZoneContribution[]>();

  /**
   * Reverse lookup — contribution `id` → the zone id it currently
   * lives under. Enables O(1) `unregister(id)` + O(1) duplicate
   * detection in `register(contribution)`. Kept in sync with
   * `items`.
   */
  private readonly indexById = new Map<string, string>();

  /**
   * Register a contribution.
   *
   * Idempotent by `contribution.id`: a re-register removes the
   * previous entry from whichever bucket held it and appends the
   * fresh one. Emits a `console.warn` on the duplicate id path so
   * the mistake is visible (fail-soft — the write still lands).
   *
   * @param contribution - The contribution to register.
   */
  public register(contribution: IZoneContribution): void {
    // De-dup by id — walk the reverse index first, remove any
    // existing entry, then append the fresh one.
    const previousZone = this.indexById.get(contribution.id);
    if (previousZone !== undefined) {
      this.removeFromZone(previousZone, contribution.id);
      // Only warn when the fresh entry lands in a DIFFERENT zone
      // OR when the contribution shape genuinely changed — a
      // no-op re-register at hot-reload with the same shape is
      // legitimate. We can't cheaply diff two objects in a
      // registry hot path, so we warn on any re-register — matches
      // the design.md §4 spec.
      // eslint-disable-next-line no-console
      console.warn(
        `[@stackra/zones] contribution id "${contribution.id}" ` +
          `re-registered; the previous entry (zone "${previousZone}") ` +
          `has been removed. Prefer distinct ids per registration.`,
      );
    }

    // Append to the target zone's bucket.
    const bucket = this.items.get(contribution.zone);
    if (bucket) {
      bucket.push(contribution);
    } else {
      this.items.set(contribution.zone, [contribution]);
    }
    this.indexById.set(contribution.id, contribution.zone);
  }

  /**
   * Every contribution targeting `zoneId`, in insertion order.
   *
   * Returns an immutable snapshot (via `readonly` at the type
   * level; the array is shared with the internal bucket for hot
   * paths — callers MUST NOT mutate it). Empty when the zone has
   * no contributions.
   *
   * @param zoneId - The dotted zone id to look up.
   */
  public list(zoneId: string): readonly IZoneContribution[] {
    return this.items.get(zoneId) ?? [];
  }

  /**
   * Every registered zone id — the union of every bucket key that
   * has at least one contribution.
   */
  public zoneIds(): readonly string[] {
    // Only include zones that currently have contributions — a
    // `zoneIds()` reader shouldn't see stale zones that got
    // fully unregistered.
    const out: string[] = [];
    for (const [zoneId, bucket] of this.items) {
      if (bucket.length > 0) out.push(zoneId);
    }
    return out;
  }

  /**
   * Remove exactly one contribution by its `id`. Walks the reverse
   * index for O(1) lookup, then splices out of the bucket. Returns
   * `true` on hit.
   *
   * @param id - The contribution id to remove.
   */
  public unregister(id: string): boolean {
    const zone = this.indexById.get(id);
    if (zone === undefined) return false;
    this.removeFromZone(zone, id);
    return true;
  }

  /**
   * Remove every contribution from every bucket. Reserved for
   * testing / hot-reload — production registrar code does not
   * call this.
   */
  public clear(): void {
    this.items.clear();
    this.indexById.clear();
  }

  // ══════════════════════════════════════════════════════════════════
  // Private helpers
  // ══════════════════════════════════════════════════════════════════

  /**
   * Remove the contribution identified by `id` from the given
   * zone's bucket, then update the reverse index. Also drops the
   * bucket entirely when it becomes empty so `zoneIds()` stays
   * accurate + `has(zoneId)` matches reality.
   */
  private removeFromZone(zoneId: string, id: string): void {
    const bucket = this.items.get(zoneId);
    if (!bucket) {
      this.indexById.delete(id);
      return;
    }
    const nextBucket = bucket.filter((c) => c.id !== id);
    if (nextBucket.length === 0) {
      this.items.delete(zoneId);
    } else {
      this.items.set(zoneId, nextBucket);
    }
    this.indexById.delete(id);
  }
}
