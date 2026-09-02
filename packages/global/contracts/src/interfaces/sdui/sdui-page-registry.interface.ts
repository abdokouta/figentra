/**
 * @file sdui-page-registry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Public contract for the SDUI page registry — the
 *   path-keyed lookup of every resolved SDUI page in the app's page
 *   catalog. Consumers reach the registry through the
 *   {@link SDUI_PAGE_REGISTRY} DI token; this interface types what
 *   they can call on the resolved value.
 *
 *   Historical note: prior to this promotion the `SDUI_PAGE_REGISTRY`
 *   token in `@stackra/contracts` referenced a phantom
 *   `ISduiPageRegistry` interface — the token existed but the shape
 *   it resolved against was missing, forcing every consumer of the
 *   token to either type-narrow to `unknown` or hand-roll a structural
 *   shim. This file is the fix, sibling to `ISduiComponentRegistry`
 *   which shipped in the §2.14 promotion.
 *
 *   The interface exposes the READ + WRITE surface consumers actually
 *   use through the DI token:
 *
 *   Concrete implementations (like `SduiPageRegistry` in
 *   `@stackra/sdui` — a `BaseRegistry<string, ISduiPageDescriptor>`)
 *   MAY expose additional methods (`replace`, `attach`, `entries`,
 *   `keys`, ...); the contract intentionally names only the surface
 *   downstream consumers need through the token so tree-shaking +
 *   test-double authoring stay cheap.
 */

import type { ISduiPageDescriptor } from "./sdui-page-resolution.interface";

/**
 * Page registry for Server-Driven UI.
 *
 * Keyed by URL `path` string (`'/orders'`, `'/orders/:id'`, …). Every
 * SDUI app that resolves pages through the SDUI runtime receives an
 * instance through the {@link SDUI_PAGE_REGISTRY} DI token and
 * delegates path lookup to it. The registry is optional at the
 * consumer level — apps without SDUI page routing simply never wire
 * the token, and the `useSduiPage` hook returns `undefined`.
 *
 * @example Read-side consumer (React hook)
 * ```typescript
 * const registry = useOptionalInject<ISduiPageRegistry>(SDUI_PAGE_REGISTRY);
 * const page = registry?.resolve(pathname);
 * return page ? <SduiScreenView screen={page.screen} /> : null;
 * ```
 *
 * @example Write-side consumer (route-sync registrar)
 * ```typescript
 * @Injectable()
 * class RouteSyncRegistrar implements OnApplicationBootstrap {
 *   public constructor(
 *     @Inject(SDUI_PAGE_REGISTRY) private readonly pages: ISduiPageRegistry,
 *   ) {}
 *
 *   public onApplicationBootstrap(): void {
 *     for (const page of fetchedPages) this.pages.register(page.path, page);
 *   }
 * }
 * ```
 */
export interface ISduiPageRegistry {
  /**
   * Check whether a page is registered under the given path.
   *
   * @param path - Normalized URL path.
   * @returns `true` when a page descriptor is registered under `path`.
   */
  has(path: string): boolean;

  /**
   * Resolve a page descriptor by URL path.
   *
   * @param path - Normalized URL path (`/orders`, `/orders/:id`, …).
   * @returns The registered descriptor, or `undefined` when no match.
   */
  resolve(path: string): ISduiPageDescriptor | undefined;

  /**
   * List every registered page descriptor.
   *
   * Order matches insertion — first registered first — matching the
   * JS `Map` iteration contract. Consumers that need a stable order
   * (e.g. sitemap generation) MUST sort the returned array
   * themselves.
   *
   * @returns A snapshot of every registered page descriptor.
   */
  list(): readonly ISduiPageDescriptor[];

  /**
   * Register (or overlay) a page under the given URL path.
   *
   * Last-wins semantics — a second `register` call for the same path
   * replaces the previous descriptor. This matches the SDUI
   * seed-loader lifecycle: route-sync contributions overlay any base
   * seed the module owner ships, and later contributions win
   * predictably.
   *
   * @param path - Normalized URL path to register.
   * @param entry - Page descriptor (id + path + optional metadata).
   */
  register(path: string, entry: ISduiPageDescriptor): void;

  /**
   * Count of registered pages.
   *
   * @returns The number of entries currently in the registry.
   */
  count(): number;
}
