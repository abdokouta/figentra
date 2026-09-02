/**
 * @file sdui-layout-registry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Public contract for the SDUI layout registry — the
 *   key-keyed lookup of every scene-template shell a screen may
 *   compose over its tree. Consumers reach the registry through the
 *   {@link SDUI_LAYOUT_REGISTRY} DI token; this interface types what
 *   they can call on the resolved value.
 *
 *   Historical note: prior to this promotion the `SDUI_LAYOUT_REGISTRY`
 *   token in `@stackra/contracts` referenced a phantom
 *   `ISduiLayoutRegistry` interface — the token existed but the shape
 *   it resolved against was missing, forcing every consumer of the
 *   token to either type-narrow to `unknown` or hand-roll a structural
 *   shim. This file is the fix, sibling to `ISduiComponentRegistry`
 *   which shipped in the §2.14 promotion.
 *
 *   The interface exposes the READ + WRITE surface consumers actually
 *   use through the DI token:
 *
 *   Concrete implementations (like `LayoutRegistry` in
 *   `@stackra/sdui` — a `BaseRegistry<string, ISduiLayoutEntry>`)
 *   MAY expose additional methods (`replace`, `attach`, `entries`,
 *   `values`, ...); the contract intentionally names only the surface
 *   downstream consumers need through the token so tree-shaking +
 *   test-double authoring stay cheap.
 */

import type { ISduiLayoutEntry } from "./sdui-registry.interface";

/**
 * Layout registry for Server-Driven UI.
 *
 * Keyed by layout `key` string — a scene-template identifier (e.g.
 * `'list'`, `'show'`, `'analytics'`). Every SDUI renderer receives an
 * instance through the {@link SDUI_LAYOUT_REGISTRY} DI token and
 * delegates layout lookup to it when `ISduiScreen.layout` is set.
 *
 * @example Read-side consumer (renderer)
 * ```typescript
 * const layouts = useInject<ISduiLayoutRegistry>(SDUI_LAYOUT_REGISTRY);
 * const layout = screen.layout ? layouts.resolve(screen.layout) : undefined;
 * const inner = layout ? createElement(layout.component, {}, tree) : tree;
 * ```
 *
 * @example Write-side consumer (`forFeature` registrar)
 * ```typescript
 * @Injectable()
 * class MyLayoutRegistrar implements OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(SDUI_LAYOUT_REGISTRY) private readonly layouts: ISduiLayoutRegistry,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     this.layouts.register("analytics", { key: "analytics", component: AnalyticsShell });
 *   }
 * }
 * ```
 */
export interface ISduiLayoutRegistry {
  /**
   * Check whether a layout key is registered.
   *
   * @param key - Layout registry key.
   * @returns `true` when a layout is registered under `key`.
   */
  has(key: string): boolean;

  /**
   * Resolve a layout by `key`.
   *
   * @param key - Layout registry key.
   * @returns The registered entry, or `undefined` when unknown.
   */
  resolve(key: string): ISduiLayoutEntry | undefined;

  /**
   * List every registered layout key.
   *
   * Order matches insertion — first registered first — matching the
   * JS `Map` iteration contract. Consumers that need a stable order
   * MUST sort the returned array themselves.
   *
   * @returns A snapshot of every registered layout `key` string.
   */
  getKeys(): readonly string[];

  /**
   * Register (or overlay) a layout under the given `key`.
   *
   * Last-wins semantics — a second `register` call for the same key
   * replaces the previous entry. This matches the SDUI seed-loader
   * lifecycle: `forFeature` contributions from packages overlay the
   * base seed the module owner ships, and later contributions win
   * predictably.
   *
   * @param key - Layout registry key to register.
   * @param entry - Layout entry (React shell component + key).
   */
  register(key: string, entry: ISduiLayoutEntry): void;

  /**
   * Count of registered layouts.
   *
   * @returns The number of entries currently in the registry.
   */
  count(): number;
}
