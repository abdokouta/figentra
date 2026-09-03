/**
 * @file mock-zone-registry.ts
 * @module @stackra/zones/testing
 * @description `MockZoneRegistry` — in-memory `IZoneRegistry` for
 *   Vitest / Jest test doubles.
 *
 *   Same behaviour as the shipping `ZoneRegistry` (idempotent by id,
 *   list returns snapshots, unregister walks the reverse index) —
 *   the mock is a slimmer implementation that skips the
 *   `BaseRegistry` inheritance so tests don't pull in the
 *   `@stackra/support` runtime unnecessarily. Suitable for
 *   `providers: [{ provide: ZONE_REGISTRY, useValue: mock }]` in
 *   container setups + for direct assertion patterns in pure
 *   `resolveZoneOrder` tests.
 */

import type { IZoneContribution, IZoneRegistry } from "@stackra/contracts";

/**
 * In-memory `IZoneRegistry` for tests.
 *
 * @example
 * ```typescript
 * import { MockZoneRegistry } from "@stackra/zones/testing";
 *
 * const registry = new MockZoneRegistry();
 * registry.register({
 *   id: "test-contribution",
 *   zone: "some.zone",
 *   kind: "react",
 *   component: () => null,
 * });
 * expect(registry.list("some.zone")).toHaveLength(1);
 * ```
 */
export class MockZoneRegistry implements IZoneRegistry {
  /** Zone id → contribution list. */
  private readonly zones = new Map<string, IZoneContribution[]>();

  /** Contribution id → owning zone id (reverse index). */
  private readonly indexById = new Map<string, string>();

  /**
   * Optional side channel for a test to see EVERY warning the mock
   * emits — assertions like
   * `expect(mock.warnings).toContain("duplicate")` become trivial.
   */
  public readonly warnings: string[] = [];

  /** @inheritdoc */
  public register(contribution: IZoneContribution): void {
    const previousZone = this.indexById.get(contribution.id);
    if (previousZone !== undefined) {
      this.warnings.push(
        `duplicate id "${contribution.id}" — previous in "${previousZone}" removed`,
      );
      this.removeFromZone(previousZone, contribution.id);
    }

    const bucket = this.zones.get(contribution.zone);
    if (bucket) {
      bucket.push(contribution);
    } else {
      this.zones.set(contribution.zone, [contribution]);
    }
    this.indexById.set(contribution.id, contribution.zone);
  }

  /** @inheritdoc */
  public list(zoneId: string): readonly IZoneContribution[] {
    return this.zones.get(zoneId) ?? [];
  }

  /** @inheritdoc */
  public zoneIds(): readonly string[] {
    const out: string[] = [];
    for (const [zoneId, bucket] of this.zones) {
      if (bucket.length > 0) out.push(zoneId);
    }
    return out;
  }

  /** @inheritdoc */
  public unregister(id: string): boolean {
    const zone = this.indexById.get(id);
    if (zone === undefined) return false;
    this.removeFromZone(zone, id);
    return true;
  }

  /** @inheritdoc */
  public clear(): void {
    this.zones.clear();
    this.indexById.clear();
    this.warnings.length = 0;
  }

  // ══════════════════════════════════════════════════════════════════
  // Test-only helpers
  // ══════════════════════════════════════════════════════════════════

  /**
   * Register many contributions in one call — convenient for test
   * setup blocks.
   */
  public registerAll(contributions: readonly IZoneContribution[]): void {
    for (const c of contributions) this.register(c);
  }

  // ══════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════

  private removeFromZone(zoneId: string, id: string): void {
    const bucket = this.zones.get(zoneId);
    if (!bucket) {
      this.indexById.delete(id);
      return;
    }
    const nextBucket = bucket.filter((c) => c.id !== id);
    if (nextBucket.length === 0) {
      this.zones.delete(zoneId);
    } else {
      this.zones.set(zoneId, nextBucket);
    }
    this.indexById.delete(id);
  }
}
