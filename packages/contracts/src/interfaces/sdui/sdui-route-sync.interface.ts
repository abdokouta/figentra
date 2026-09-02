/**
 * @file sdui-route-sync.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Contract for the SDUI route-sync bridge — projects
 *   schema-registered pages into the workspace's `ROUTE_REGISTRY` at
 *   `OnApplicationBootstrap` so every SDUI-authored page appears as
 *   a first-class route with guards + middleware + SEO + analytics.
 *
 *   The concrete implementation lives in `@stackra/sdui/react` (it
 *   needs the `<SchemaRoute />` component from React to stamp on
 *   each route's `Component` field). The contract stays here so the
 *   `SDUI_ROUTE_SYNC` DI token narrows type-safely at every consumer.
 *
 *   The interface intentionally exposes the SYNC surface only — the
 *   sync is fire-once at bootstrap; no runtime add / remove API.
 *   Downstream hot-swap scenarios use `ISduiPageRegistry.register`
 *   directly and drive a re-sync via a separate lifecycle event.
 */

/**
 * Bridge that projects every registered SDUI page (see
 * `ISduiPageRegistry.list()`) into the routing runtime's
 * `ROUTE_REGISTRY` at bootstrap.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class SduiRouteSyncService implements ISduiRouteSync, OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(SDUI_PAGE_REGISTRY) private readonly pages: ISduiPageRegistry,
 *     @Inject(ROUTE_REGISTRY) private readonly routes: RouteRegistry,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     this.sync();
 *   }
 *
 *   public sync(): number {
 *     let n = 0;
 *     for (const page of this.pages.list()) {
 *       this.routes.registerRoute({
 *         id: page.id,
 *         path: page.path,
 *         Component: SchemaRoute,
 *       }, `sdui:${page.id}`);
 *       n += 1;
 *     }
 *     return n;
 *   }
 * }
 * ```
 */
export interface ISduiRouteSync {
  /**
   * Project every SDUI page descriptor from
   * `ISduiPageRegistry.list()` into the framework routing registry.
   *
   * @returns The number of routes that were projected on this call.
   *   Idempotent — a second call with an unchanged page registry
   *   emits the same routes (the underlying `RouteRegistry.register`
   *   is last-wins per id).
   */
  sync(): number;
}
