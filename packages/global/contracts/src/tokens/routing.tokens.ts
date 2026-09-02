/**
 * @file routing.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens + metadata keys for the routing subsystem
 *   shipped by `@stackra/routing`.
 *
 *   Note: `ROUTE_REGISTRY` and `ROUTE_METADATA_KEY` are declared here
 *   (not in `ssr.tokens.ts`). They are `Symbol.for(...)` keyed, so the
 *   `@stackra/ssr` package continues to resolve to the same underlying
 *   symbol during the transition — until `@stackra/ssr` is removed
 *   entirely.
 */

/** Token for the merged routing module configuration. */
export const ROUTING_CONFIG = "routing" as const;

/**
 * Token for the `RouteRegistry` singleton — holds the UI route tree
 * populated at bootstrap by `RoutingModule.forRoot(...)` and any
 * `RoutingModule.forFeature(...)` contributions.
 */
export const ROUTE_REGISTRY = Symbol.for("ROUTE_REGISTRY");

/**
 * Token for the `RouteMatcherService` — runs advanced matchers
 * (subdomain, query, header, hash) before RRv7's path matcher.
 */
export const ROUTE_MATCHER = Symbol.for("ROUTE_MATCHER");

/**
 * Token for the optional `AiRouteContextService` — registered only
 * when `RoutingModule.forRoot({ ai: true })` is set. Publishes the
 * current match chain to `@stackra/ai`'s context registry.
 */
export const AI_ROUTE_CONTEXT = Symbol.for("AI_ROUTE_CONTEXT");

/**
 * Token for the `SeoService` — walks the RRv7 match chain, merges
 * every route's `seo` descriptor, and renders the resulting `<title>`,
 * `<meta>`, `<link>`, and JSON-LD `<script>` tags via `<SeoHead />`
 * from `@stackra/routing/react`.
 */
export const SEO_SERVICE = Symbol.for("SEO_SERVICE");

/**
 * Token for the merged SEO defaults — the `seo` block nested inside
 * `ROUTING_CONFIG`. Kept as its own binding so consumers (custom SEO
 * renderers, edge-worker head injectors) can inject the defaults
 * without walking the full routing config.
 */
export const SEO_CONFIG = "routing.seo" as const;

// ────────────────────────────────────────────────────────────────────────────
// Native subpath tokens — bound only by `@stackra/routing/native`.
// The runtime layer is `NativeRoutingModule`; the web layer never
// resolves these. Split from the web tokens so a downstream package
// injecting the screen registry doesn't accidentally reach the web
// route registry.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Token for the merged native routing configuration. Bound by
 * `NativeRoutingModule.forRoot(...)` alongside `ROUTING_CONFIG`
 * (which stays bound by the composed core `RoutingModule`).
 *
 * Consumers reach it via `useInject(NATIVE_ROUTING_CONFIG)`.
 */
export const NATIVE_ROUTING_CONFIG = "routing.native" as const;

/**
 * Token for the `ScreenRegistry` singleton — the native
 * counterpart to `ROUTE_REGISTRY`. Holds `IScreenRecord[]` seeded at
 * bootstrap from the module config's `screens` field (and, later,
 * from `NativeRoutingModule.forFeature(...)` contributions).
 */
export const NATIVE_SCREEN_REGISTRY = Symbol.for("NATIVE_SCREEN_REGISTRY");

/**
 * Token for the `LinkingBuilderService` — converts the screen tree
 * into React Navigation's `LinkingOptions.config` shape at boot.
 * Consumers who need the built linking config for a custom
 * `<NavigationContainer linking={...}>` mount reach for this token.
 */
export const NATIVE_LINKING_BUILDER = Symbol.for("NATIVE_LINKING_BUILDER");

/**
 * Token for the `NativeGuardResolverService` — bridges the
 * workspace guard pipeline (`@stackra/routing/guards`) into React
 * Navigation's per-screen `usePreventRemove` / focus lifecycle.
 */
export const NATIVE_GUARD_RESOLVER = Symbol.for("NATIVE_GUARD_RESOLVER");

// ────────────────────────────────────────────────────────────────────────────
// Metadata keys — stamped by `@stackra/decorators/routing` decorators.
// ────────────────────────────────────────────────────────────────────────────

/** Metadata key for the `@Route(...)` decorator (route module descriptors). */
export const ROUTE_METADATA_KEY = "stackra:routing:route";

/** Metadata key stamped by `defineLayout()` on layout modules. */
export const LAYOUT_METADATA_KEY = "stackra:routing:layout";

/** Metadata key stamped by `definePage()` on page modules. */
export const PAGE_METADATA_KEY = "stackra:routing:page";

/** Metadata key for the `@Guard(...)` decorator. */
export const GUARD_METADATA_KEY = "stackra:routing:guard";

/** Metadata key for the `@Middleware(...)` decorator. */
export const MIDDLEWARE_METADATA_KEY = "stackra:routing:middleware";

/** Metadata key for the `@RequireRole(role)` decorator. */
export const REQUIRE_ROLE_METADATA_KEY = "stackra:routing:require-role";

/** Metadata key for the `@RequirePermission(permission)` decorator. */
export const REQUIRE_PERMISSION_METADATA_KEY =
  "stackra:routing:require-permission";

/** Metadata key for the `@RequireAny(clauses)` decorator. */
export const REQUIRE_ANY_METADATA_KEY = "stackra:routing:require-any";
