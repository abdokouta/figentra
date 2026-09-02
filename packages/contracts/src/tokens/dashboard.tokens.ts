/**
 * @file dashboard.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/dashboard` runtime — a
 *   widget-based dashboard shell with appearance controls, cohort +
 *   widget registries, and pluggable widget renderers.
 *
 *   Every token uses `Symbol.for(...)` so the same identity is
 *   observed across module realms.
 */

// ── Config + core services ────────────────────────────────────

/** DI token for the merged `IDashboardModuleOptions`. */
export const DASHBOARD_CONFIG = "dashboard" as const;

/** DI token for the `DashboardService` — hydrates layout + catalogue. */
export const DASHBOARD_SERVICE = Symbol.for(
  "@stackra/dashboard/DASHBOARD_SERVICE",
);

/** DI token for the `AppearanceService` — density + tab + view state. */
export const APPEARANCE_SERVICE = Symbol.for(
  "@stackra/dashboard/APPEARANCE_SERVICE",
);

/** DI token for the `IStorage` instance persisting dashboard preferences. */
export const DASHBOARD_STORAGE = Symbol.for(
  "@stackra/dashboard/DASHBOARD_STORAGE",
);

// ── Widget registries ─────────────────────────────────────────

/** DI token for the `WidgetCatalogueService` — installable widget catalog. */
export const WIDGET_CATALOGUE_SERVICE = Symbol.for(
  "@stackra/dashboard/WIDGET_CATALOGUE_SERVICE",
);

/** DI token for the `WidgetRegistry` — instances of widgets on a grid. */
export const WIDGET_REGISTRY = Symbol.for("@stackra/dashboard/WIDGET_REGISTRY");

/** DI token for the `WidgetCohortRegistry` — widget cohort/group labels. */
export const WIDGET_COHORT_REGISTRY = Symbol.for(
  "@stackra/dashboard/WIDGET_COHORT_REGISTRY",
);

/** DI token for the `WidgetRendererRegistry` — component renderers per widget key. */
export const WIDGET_RENDERER_REGISTRY = Symbol.for(
  "@stackra/dashboard/WIDGET_RENDERER_REGISTRY",
);

// ── Metadata keys + validation patterns ───────────────────────

/**
 * Metadata key stamped by the `@Widget()` class decorator via
 * `@vivtel/metadata`.
 *
 * The `WidgetLoader` inside `@stackra/dashboard` calls
 * `discovery.getProvidersByMetadata(WIDGET_METADATA_KEY)` during
 * `onApplicationBootstrap` to enumerate every widget contribution.
 *
 * Uniform naming with every other discovery consumer in the
 * workspace (console, cache, events, queue, routing) — the key is
 * `"stackra:<pkg>:<artefact>"` so a log grep resolves the owner at
 * a glance.
 */
export const WIDGET_METADATA_KEY = "stackra:dashboard:widget";

/**
 * Kebab-case shape used for both widget keys and cohort keys —
 * `@Widget()` validates its `key` field against this pattern at
 * decoration time so a typo (`Kpi-Athletes`, `kpi_athletes`, ...)
 * fails loud at class-load rather than silently at runtime.
 *
 * Lowercase letters + digits + hyphens; must start with a letter;
 * hyphens only allowed between segments (no leading, trailing, or
 * consecutive hyphens). Single-word keys are permitted (`numbers`,
 * `charts`).
 */
export const WIDGET_KEY_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Kebab-case shape used for widget cohort keys.
 *
 * Cohort keys and widget keys share the same shape today — but the
 * two constants stay separate so a future divergence (e.g. cohorts
 * gaining a mandatory prefix) can update one without touching the
 * other.
 */
export const COHORT_KEY_PATTERN = WIDGET_KEY_PATTERN;
