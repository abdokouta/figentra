/**
 * @file sdui-component-registry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Public contract for the SDUI component registry — the
 *   name-keyed lookup of every renderable SDUI type. Consumers reach
 *   the registry through the {@link SDUI_COMPONENT_REGISTRY} DI token;
 *   this interface types what they can call on the resolved value.
 *
 *   Historical note: prior to this promotion `@stackra/sdui` shipped a
 *   local `IComponentRegistryLike` structural shim in its validator
 *   because the workspace lacked a canonical registry contract. That
 *   shim violated `.kiro/steering/contract-reexports.md` §"never
 *   define a local I*Like structural shim for a missing contract" —
 *   this file is the fix.
 *
 *   The interface exposes the READ + WRITE surface consumers actually
 *   use through the DI token:
 *
 *   Concrete implementations (like `ComponentRegistry` in
 *   `@stackra/sdui` — a `BaseRegistry<string, ISduiComponentEntry>`)
 *   MAY expose additional methods (`replace`, `attach`, `entries`,
 *   `values`, ...); the contract intentionally names only the surface
 *   downstream consumers need through the token so tree-shaking +
 *   test-double authoring stay cheap.
 */

import type { ISduiComponentEntry } from "./sdui-registry.interface";

/**
 * Component registry for Server-Driven UI.
 *
 * Keyed by node `type` string (dotted keys allowed — e.g.
 * `'Card.Header'`). Every SDUI renderer receives an instance through
 * the {@link SDUI_COMPONENT_REGISTRY} DI token and delegates node
 * lookup to it.
 *
 * @example Read-side consumer (renderer)
 * ```typescript
 * const registry = useInject<ISduiComponentRegistry>(SDUI_COMPONENT_REGISTRY);
 * const entry = registry.resolve(node.type);
 * if (!entry) throw new Error(`Unknown SDUI type: ${node.type}`);
 * ```
 *
 * @example Read-side consumer (validator)
 * ```typescript
 * function validate(screen: ISduiScreen, registry: ISduiComponentRegistry): void {
 *   for (const node of walk(screen.root)) {
 *     if (!registry.has(node.type)) throw new Error(`Unknown type: ${node.type}`);
 *   }
 * }
 * ```
 *
 * @example Write-side consumer (`forFeature` registrar)
 * ```typescript
 * @Injectable()
 * class MyFeatureRegistrar implements OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(SDUI_COMPONENT_REGISTRY) private readonly registry: ISduiComponentRegistry,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     this.registry.register("MyBrandCard", { component: MyBrandCard });
 *   }
 * }
 * ```
 */
export interface ISduiComponentRegistry {
  /**
   * Check whether a component type is registered.
   *
   * @param type - Node `type` string.
   * @returns `true` when a component is registered under `type`.
   */
  has(type: string): boolean;

  /**
   * Resolve a component by node `type`.
   *
   * @param type - Node `type` string.
   * @returns The registered entry, or `undefined` when unknown.
   */
  resolve(type: string): ISduiComponentEntry | undefined;

  /**
   * List every registered component type.
   *
   * Order matches insertion — first registered first — matching the
   * JS `Map` iteration contract. Consumers that need a stable order
   * MUST sort the returned array themselves.
   *
   * @returns A snapshot of every registered `type` string.
   */
  getTypes(): readonly string[];

  /**
   * Register (or overlay) a component under the given `type`.
   *
   * Last-wins semantics — a second `register` call for the same key
   * replaces the previous entry. This matches the SDUI seed-loader
   * lifecycle: `forFeature` contributions from packages overlay the
   * base seed the module owner ships, and later contributions win
   * predictably.
   *
   * @param type - Node `type` string to register.
   * @param entry - Component entry (React renderer + optional prop
   *   adapter + event map).
   */
  register(type: string, entry: ISduiComponentEntry): void;

  /**
   * Count of registered components.
   *
   * @returns The number of entries currently in the registry.
   */
  count(): number;
}
