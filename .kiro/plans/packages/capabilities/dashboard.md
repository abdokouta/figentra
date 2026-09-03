---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/dashboard'
---

# `@stackra/dashboard` — cross-runtime dashboard capability

## Purpose

Provide the reusable dashboard runtime used by authenticated SaaS applications, admin consoles and tenant workspaces. The package supports configurable dashboards, widget catalogs, responsive grid layouts, presets, filters, appearance, sharing/embed, kiosk/present mode and React/React Native rendering. The attached Dashboard Studio reference is treated as the feature baseline; implementation must preserve its useful contracts while replacing any legacy package boundaries with the Figentra package law.

## Boundary

The package owns dashboard document contracts, widget metadata/registration, layout computation, presentation state and client integration. It does not own business analytics, report definitions, domain entities, user identity, IAM, billing or persistent database tables.

```text
@stackra/dashboard
@stackra/dashboard/react
@stackra/dashboard/native
@stackra/dashboard/nestjs
@stackra/dashboard/testing
```

The root is runtime-neutral. React/Native dependencies are isolated in subpaths. NestJS is an integration/export boundary for persistence and HTTP contracts; it is not a standalone Dashboard service.

## End-to-end ownership

```text
Domain service / Analytics / Reporting
          ↓ versioned widget-data contract
Owning application / dashboard backend
          ↓ Dashboard persistence API
@stackra/dashboard/nestjs
          ↓ persisted dashboard document + revisions
PostgreSQL/object storage owned by host service
          ↓ HTTPS/OpenAPI
@stackra/dashboard/react or /native
          ↓
widget registry → data client → renderer
```

A widget never accesses another service database directly. The backend controls authorization and resolves business data; the package only defines how widgets consume typed data.

## Document model

```ts
interface DashboardDocument {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  slug: string;
  visibility: DashboardVisibility;
  shareLevel: DashboardShareLevel;
  isPinned: boolean;
  isDefault: boolean;
  layoutMode: DashboardLayoutMode;
  density?: DashboardDensity;
  layouts: Record<DashboardBreakpoint, readonly DashboardLayoutItem[]>;
  widgets: readonly WidgetInstance[];
  filters?: DashboardFilters;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

The document is a versioned aggregate. Built-in dashboards are immutable definitions. User dashboards are persisted revisions; the host backend remains the source of truth.

## Widget model

A widget has stable key/version, metadata, placement, configuration and data contract references.

```ts
interface WidgetDefinition {
  key: string;
  version: string;
  title: LocalizedText;
  description?: LocalizedText;
  category: WidgetCategory;
  icon?: string;
  defaultLayout: WidgetDefaultLayout;
  allowedContexts: WidgetContext[];
  requiredCapabilities?: string[];
  requiredPermissions?: string[];
  configSchema: JsonSchema;
  dataContract: WidgetDataContract;
  rendererRequirements: WidgetRendererRequirements;
}
```

Widget implementation and renderer registration are local application concerns. Metadata must be serializable and safe to publish to clients.

## Widget catalogue and discovery

Registration uses a deterministic registry/catalogue. Duplicate widget keys fail during application bootstrap. Cohorts/categories are registered before widgets. Discovery may find framework-decorated widget contributions, but discovery never becomes persistence or service ownership.

The catalogue provides search/list/group/default-layout operations and exposes only metadata to consumers. Renderer classes and live instances never cross service/network boundaries.

## Layout engine

Canonical layouts are constraint-based and breakpoint-aware:

```text
desktop / tablet / mobile
columns, rows, span, min/max, gap, order, visibility
```

The package must support drag-and-drop reorder and span changes, deterministic auto-layout, collision handling, compacting and stable widget IDs. Browser coordinates are transient; they are not persisted as the canonical layout.

The attached implementation's thirds/halves/full-span behavior maps to a generic span model rather than fixed application-specific widths.

## Dashboard customizer

The React editor provides four logical surfaces matching the reference implementation:

```text
Widgets | Layout | Settings | Filters
```

Customization mutations are commands against dashboard state. The UI must never mutate persisted JSON directly.

Supported operations include add/remove widget, reorder, resize/span, reset layout, rename, slug update, pin/default state, visibility/share configuration and dashboard-level filters.

## Widget data flow

A widget may declare:

```text
static configuration
backend data source
report key
metric key
query descriptor
```

The renderer requests data through a typed host data client. The widget configuration cannot contain arbitrary URLs, SQL, provider DSL or credentials.

For example:

```text
product-sales widget
    ↓
Report key = commerce.sales.summary
    ↓
Reporting client
    ↓
authorized query
    ↓
ReportResult
    ↓
widget renderer
```

Analytics/Reporting facts remain owned by their services.

## React integration

`@stackra/dashboard/react` exports:

```text
DashboardProvider
useDashboard
useAppearance
useDashboardLayout
useWidgetCatalogue
useWidgetData
DashboardPage
DashboardGrid
DashboardTabs
WidgetContainer
WidgetErrorBoundary
CustomizerPanel
ShareDashboardDialog
KioskView
AnalyticsView
```

The renderer registry is injected through the host container. Editor overlays decorate the production widget renderer instead of maintaining a separate fake rendering tree.

## React Native integration

`@stackra/dashboard/native` provides native equivalents and the reference behavior required for mobile:

```text
NativeDashboard
NativeWidgetRenderer
WidgetContainer
WidgetConfigSheet
PullToRefreshWrapper
WidgetErrorBoundary
useDashboardLayout
useWidgetConfig
usePullToRefresh
KpiCard
ListWidget
ChartWidget
CalendarWidget
ActivityWidget
```

The native runtime uses native layout/rendering adapters and never assumes DOM APIs. Widget data contracts remain shared with React.

## NestJS integration

`@stackra/dashboard/nestjs` is the mandatory backend integration path when a consumer persists dashboards.

Exports:

```ts
DashboardModule
DashboardPersistenceAdapter
DashboardRepository
DashboardControllerFactory
DashboardDto
CreateDashboardDto
UpdateDashboardDto
DashboardRevisionDto
DashboardShareDto
WidgetCatalogueMetadataDto
DashboardAuthorizationGuard
DashboardPersistenceOptions
```

Persistence is injected rather than hard-coded so a service can use its chosen ORM/DB. The adapter must support:

```ts
interface DashboardPersistenceAdapter {
  list(ctx, input): Promise<readonly DashboardDocument[]>;
  get(ctx, id): Promise<DashboardDocument>;
  create(ctx, input): Promise<DashboardDocument>;
  update(ctx, id, expectedVersion, input): Promise<DashboardDocument>;
  delete(ctx, id, expectedVersion): Promise<void>;
  createRevision(ctx, id, input): Promise<DashboardRevision>;
  publishRevision(ctx, id, revisionId): Promise<DashboardDocument>;
  restoreRevision(ctx, id, revisionId): Promise<DashboardDocument>;
}
```

The adapter enforces tenant/owner scope in the backend and uses optimistic version checks. It never trusts a client-supplied tenant ID.

## Persistence model required from a host service

At minimum:

```text
 dashboards
 dashboard_revisions
 dashboard_widget_data_cache (optional, disposable)
 dashboard_share_grants
 dashboard_embed_tokens
 dashboard_tab_presets
```

`dashboard_revisions` are immutable. The current dashboard points to the selected revision. Publish/rollback is an explicit transition. Share/embed tokens are hashed at rest and revocable.

## Sharing and embedding

Support private, tenant, role-targeted and public/embed visibility according to the host application's IAM contract. Public embeds use short-lived or revocable signed tokens, origin allowlists, rate limits and safe read-only dashboard projections. Embed sessions never gain mutation privileges.

## Appearance

The appearance store covers the reference capabilities:

```text
accent
radius
color preset
font scale
density
reduced motion
```

Appearance is presentation state, separate from business dashboard content. Tenant defaults may be supplied by host configuration; user overrides remain user-owned.

## Kiosk/present/analytics views

Kiosk/present mode is a view transform over the dashboard document. Analytics view can compose Report/Analytics-backed widgets. No separate business dataset is introduced by the dashboard package.

## Tabs, presets and defaults

Dashboards may expose tabs. System, role and user presets are identified by stable scope keys. Default-dashboard uniqueness is enforced transactionally by the host persistence adapter.

## Filtering

Dashboard-level filters use typed definitions with field/operator/value constraints. Each widget explicitly opts in to compatible filter keys. Filter values are validated before propagation and cannot override backend authorization filters.

## Security and multi-tenancy

All backend operations receive platform RequestContext. Authorization is evaluated by IAM/host service. Visibility is not authorization by itself. Widget metadata must not disclose protected resource names or fields unless the caller is authorized.

No widget can:

- execute SQL;
- call arbitrary third-party APIs;
- receive provider credentials;
- bypass tenant filters;
- mutate dashboard persistence without a backend command;
- render unsanitized trusted HTML by default.

## Caching

Client query caching may reuse `@stackra/query` semantics. Public immutable dashboard revisions may use HTTP cache validators. Personalized dashboards are `private` and scoped by tenant/principal context. Persistence remains durable; cache is disposable.

## Failure and concurrency

A failed widget data request is isolated by `WidgetErrorBoundary` and must not tear down the dashboard. Dashboard mutations use optimistic version numbers. A stale write returns a typed conflict with the current version; automatic destructive merge is forbidden.

Offline/native edits may queue through `@stackra/sync`, but the server remains authoritative for persisted dashboard revisions.

## Observability and audit

Operational metrics include render duration, widget error rate, data-fetch latency, layout mutation latency and save conflicts. Publish/share/revoke operations may emit Audit events through `@stackra/audit`; operational logs and telemetry do not become audit records.

## Testing

Required suites include widget registry duplicate detection, catalogue ordering, layout determinism, drag/drop legality, responsive compilation, dashboard CRUD adapter contract, optimistic locking, tenant isolation, share/embed authorization, token revocation, public/private caching, React rendering, React Native rendering, widget failure isolation, keyboard accessibility, reduced-motion behavior and end-to-end persistence against a real NestJS test application.

The reference implementation's fixture categories should be represented as conformance fixtures, not copied application state.

## Versioning and migration

Dashboard documents carry schema version. Readers support current plus the immediately previous supported schema during migration windows. Published revisions are immutable. Breaking layout/widget schema changes require explicit migrators and golden fixtures.

## Production exit criteria

- React and React Native share the same dashboard/document/data contracts.
- A real NestJS persistence adapter can persist, version, publish, restore and authorize dashboards.
- Widget providers remain vendor-neutral and business-service-owned.
- No DOM coordinates are persisted as canonical layout.
- Public embeds are scoped, revocable and read-only.
- Dashboard failures are isolated per widget.
- The package can be consumed without introducing a Dashboard microservice.
