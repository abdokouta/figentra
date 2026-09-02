/**
 * @file route-provider.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Shapes for the class-based route contribution API —
 *   the metadata a `@Route()`-decorated class carries, and the
 *   `IRouteProvider` interface every such class implements so the
 *   discovery loader can extract a route record from it.
 *
 *   ## Design: paths live in the decorator
 *
 *   `IRouteMetadata` extends `Partial<Omit<IRouteRecord, "id">>` —
 *   every field a route record can carry (path, Component, index,
 *   guards, middleware, seo, ...) is stampable directly on the class
 *   via the decorator. The framework's default `BaseRoute.getRecord()`
 *   reads that metadata and returns it verbatim, so the typical
 *   route class is a one-liner:
 *
 *   ```typescript
 *   @Route({ id: "rbac:roles-list", path: "/admin/roles", Component: RolesListPage })
 *   export class RolesListRoute extends BaseRoute {}
 *   ```
 *
 *   Grouped in one file per code-standards.md §"Composite family
 *   grouping" because both shapes exist only in service of the
 *   `@Route()` decorator + `RouteLoader` pair.
 */

import type { IRouteRecord } from "./route-record.interface";

// ════════════════════════════════════════════════════════════════════════════
// Decorator metadata
// ════════════════════════════════════════════════════════════════════════════

/**
 * Metadata a `@Route(...)`-decorated class carries.
 *
 * Extends `Partial<Omit<IRouteRecord, "id">>` — every field a route
 * record can hold (path, Component, index, guards, middleware, seo,
 * children, ...) is stampable at decoration time. `id` is required
 * separately (`IRouteRecord.id` is optional, but the class-based
 * contribution API always names a route). `source` is a routing-
 * registry tag; it never reaches the RRv7 route record.
 *
 * @example
 * ```typescript
 * import { BaseRoute, Route } from "@stackra/routing";
 * import { RolesListPage } from "../../react/pages/roles-list-page";
 *
 * @Route({
 *   id: "rbac:roles-list",
 *   source: "rbac",
 *   path: "/admin/roles",
 *   Component: RolesListPage,
 * })
 * export class RolesListRoute extends BaseRoute {}
 * ```
 */
export interface IRouteMetadata extends Partial<Omit<IRouteRecord, "id">> {
  /**
   * Stable identifier for the route, used for source tagging in the
   * registry and for cross-cutting references (deep-link resolution,
   * breadcrumb hydration).
   *
   * Convention: `<package-slug>:<route-slug>` — e.g. `rbac:roles-list`,
   * `grants:grant-detail`.
   */
  readonly id: string;

  /**
   * @default "decorator"
   */
  readonly source?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Runtime provider
// ════════════════════════════════════════════════════════════════════════════

/**
 * Contract every `@Route(...)`-decorated class implements.
 *
 * The `RouteLoader` calls `getRecord()` at
 * `OnApplicationBootstrap` after the container has resolved every
 * provider. `BaseRoute` (in `@stackra/routing`) provides a concrete
 * default that reads the decorator metadata and returns it as the
 * record — so most classes don't override this method.
 *
 * Advanced cases that DO need runtime state (a feature-flag-gated
 * route that inspects env vars in its constructor) can still
 * override `getRecord()` to return a different value; the framework
 * accepts either shape.
 */
export interface IRouteProvider {
  /**
   * Produce the route record to register with the routing registry.
   *
   * Called ONCE per bootstrap. The returned record is registered
   * verbatim under the id from the `@Route()` metadata.
   *
   * @returns The fully-resolved route record (path, component,
   *   guards, middleware, seo, ...) ready to hand to React Router.
   */
  getRecord(): IRouteRecord;
}
