/**
 * @file sdui.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the Server-Driven UI runtime.
 */

/** DI token — resolves the SDUI module options object. */
export const SDUI_CONFIG = "sdui" as const;

/** DI token — resolves the primary `ISduiService` orchestrator. */
export const SDUI_SERVICE = Symbol.for("SDUI_SERVICE");

/** DI token — resolves the page-level `ISduiPagesService`. */
export const SDUI_PAGES_SERVICE = Symbol.for("SDUI_PAGES_SERVICE");

/** DI token — resolves the `ISduiPageResolver` (URL → page id). */
export const SDUI_PAGE_RESOLVER = Symbol.for("SDUI_PAGE_RESOLVER");

/** DI token — resolves the `ISduiPageRegistry` (page id → schema). */
export const SDUI_PAGE_REGISTRY = Symbol.for("SDUI_PAGE_REGISTRY");

/** DI token — resolves the `ISduiRouteSync` bridge that wires SDUI pages into the routing graph. */
export const SDUI_ROUTE_SYNC = Symbol.for("SDUI_ROUTE_SYNC");

/** DI token — resolves the `ISduiSchemaCache` (compiled-schema memo). */
export const SDUI_SCHEMA_CACHE = Symbol.for("SDUI_SCHEMA_CACHE");

/** DI token — resolves the `ISduiComponentRegistry` (component name → renderer). */
export const SDUI_COMPONENT_REGISTRY = Symbol.for("SDUI_COMPONENT_REGISTRY");

/** DI token — resolves the `ISduiLayoutRegistry` (layout name → shell). */
export const SDUI_LAYOUT_REGISTRY = Symbol.for("SDUI_LAYOUT_REGISTRY");

/** DI token — resolves the `ISduiActionAdapter` that runs `action.*` events emitted from SDUI trees. */
export const SDUI_ACTION_ADAPTER = Symbol.for("SDUI_ACTION_ADAPTER");

/** DI token — resolves the `ISduiDataSourceResolver` (data-binding source lookup). */
export const SDUI_DATA_SOURCE_RESOLVER = Symbol.for(
  "SDUI_DATA_SOURCE_RESOLVER",
);

/** DI token — resolves the transport-layer `ISduiClient` used to fetch schemas. */
export const SDUI_CLIENT = Symbol.for("SDUI_CLIENT");
/**
 * DI token — resolves the `ISduiResourceCatalogClient` used to fetch
 * the platform-admin resource catalogue from `GET /api/v1/platform/schema`.
 *
 * Distinct from `SDUI_CLIENT` (which fetches per-screen SDUI schemas) —
 * the catalogue is one flat metadata list, not a screen definition.
 */
export const SDUI_RESOURCE_CATALOG_CLIENT = Symbol.for(
  "SDUI_RESOURCE_CATALOG_CLIENT",
);
/**
 * DI token — resolves the `ISduiResourceCatalogService` orchestrator
 * that caches the fetched catalogue in the runtime.
 */
export const SDUI_RESOURCE_CATALOG_SERVICE = Symbol.for(
  "SDUI_RESOURCE_CATALOG_SERVICE",
);
