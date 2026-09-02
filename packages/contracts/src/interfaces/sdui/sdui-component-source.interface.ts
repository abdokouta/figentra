/**
 * @file sdui-component-source.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Contract for a hydration source of the composite SDUI
 *   component registry.
 *
 *   Every source of components (HeroUI, HeroUI Pro, marketing,
 *   ecommerce, primitives, layouts, zone types, consumer overrides,
 *   tenant overrides) implements this interface. Sources are
 *   discovered at bootstrap via the
 *   `SDUI_COMPONENT_SOURCE_METADATA_KEY` metadata stamp, sorted by
 *   their {@link ISduiComponentSource.priority} ascending, and merged
 *   into the composite `ComponentRegistry` via `hydrate(target)`.
 *
 *   ## Priority ladder
 *
 *   The order of the ladder is codified by the SDUI Day-One design
 *   doc (see `.kiro/specs/sdui-day-one/design.md` §"The composite
 *   catalogue"). Later priorities WIN — hydration is
 *   last-write-wins per key.
 *
 *   | Priority | Source                              |
 *   | -------: | ----------------------------------- |
 *   |       50 | Primitives (Box / Stack / Grid ...) |
 *   |      100 | HeroUI OSS                          |
 *   |      200 | HeroUI Pro                          |
 *   |      300 | Stackra marketing                   |
 *   |      400 | Stackra ecommerce                   |
 *   |      500 | Built-in layouts                    |
 *   |      600 | Zone                                |
 *   |    700 + | Consumer-supplied contributions     |
 *   |    900 + | Tenant runtime overrides (future)   |
 *
 *   A tenant registering an override at priority 999 always shadows
 *   a marketing entry at priority 300 without touching the source's
 *   code path. Reordering the module's `providers: [...]` never
 *   changes semantics; only editing a source's `PRIORITY` static
 *   does.
 */

import type { ISduiComponentEntry } from "./sdui-component-entry.interface";

/**
 * Minimal structural shape of the hydration target — anything that
 * exposes a `replace(key, value)` method compatible with the
 * `@stackra/support` `BaseRegistry.replace` signature.
 *
 * Declared structurally at the contract layer so `@stackra/contracts`
 * doesn't take a hard dependency on `@stackra/support`. Concrete
 * implementations pass a `BaseRegistry<string, ISduiComponentEntry>`
 * instance and TypeScript widens through structural subtyping.
 */
export interface ISduiHydrationTarget {
  /**
   * Overwrite the value at `key` (or set it if absent).
   *
   * Last-write-wins semantics; the method never throws on duplicate
   * keys. Matches the `BaseRegistry.replace` contract shipped by
   * `@stackra/support`.
   *
   * @param key - The registry key to overwrite.
   * @param value - The value to store.
   * @returns The target itself, to permit chaining (mirrors
   *   `BaseRegistry.replace`).
   */
  replace(key: string, value: ISduiComponentEntry): unknown;
}

/**
 * A hydration source contributing entries to the composite SDUI
 * component registry.
 *
 * Every implementation is an `@Injectable()` class that also
 * extends `BaseRegistry<string, ISduiComponentEntry>` from
 * `@stackra/support`. The self-owned registry surface lets each
 * source seed its built-in entries at construction (or in
 * `OnModuleInit` per the workspace's module-lifecycle rules), and
 * `hydrate(target)` iterates those entries and calls
 * `target.replace(key, value)` on the composite.
 *
 * ## Discovery contract
 *
 * The `ComponentSourceHydrator` in `@stackra/sdui/core/loaders/`
 * queries
 * `DISCOVERY_SERVICE.getProvidersByMetadata(SDUI_COMPONENT_SOURCE_METADATA_KEY)`
 * at `OnApplicationBootstrap`, resolves each match to its provider
 * instance, sorts by {@link priority} ascending, and calls
 * `hydrate(composite)` per source. Every source class MUST be
 * decorated with an `@SduiComponentSource(...)` metadata stamp — see
 * `@stackra/decorators/sdui`.
 *
 * @example
 * ```typescript
 * import { SduiComponentSource } from "@stackra/decorators/sdui";
 * import { BaseRegistry } from "@stackra/support";
 * import type {
 *   ISduiComponentEntry,
 *   ISduiComponentSource,
 * } from "@stackra/contracts";
 *
 * @SduiComponentSource({ priority: 100 })
 * export class HeroUiRegistry
 *   extends BaseRegistry<string, ISduiComponentEntry>
 *   implements ISduiComponentSource
 * {
 *   public static readonly PRIORITY = 100;
 *   public readonly priority = HeroUiRegistry.PRIORITY;
 *
 *   public hydrate(target: BaseRegistry<string, ISduiComponentEntry>): void {
 *     for (const [key, value] of this.entries()) {
 *       target.replace(key, value);
 *     }
 *   }
 * }
 * ```
 */
export interface ISduiComponentSource {
  /**
   * Priority ordering — ascending, later wins.
   *
   * Every source class MUST also expose the value as
   * `public static readonly PRIORITY: number` so consumers can
   * inspect the ladder without instantiating the class. The
   * instance property + the static property MUST always agree —
   * `public readonly priority = MyRegistry.PRIORITY;` is the
   * canonical pattern.
   */
  readonly priority: number;

  /**
   * Merge every entry this source owns into the target registry.
   *
   * Implementations iterate their own entries (they extend
   * `BaseRegistry<string, ISduiComponentEntry>`) and call
   * `target.replace(key, value)` — last-write-wins on collision.
   *
   * The hydrator calls this once per source at
   * `OnApplicationBootstrap`, sorted by {@link priority} ascending.
   *
   * @param target - The composite registry to merge into. Typed
   *   structurally as {@link ISduiHydrationTarget} at the contract
   *   layer to avoid a hard dependency from `@stackra/contracts` on
   *   `@stackra/support`. Concrete implementations pass their
   *   `BaseRegistry<string, ISduiComponentEntry>` composite; the
   *   structural subtype match is safe.
   */
  hydrate(target: ISduiHydrationTarget): void;
}
