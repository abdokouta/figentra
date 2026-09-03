---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
scope: search-reporting-dashboard-seo
---

# Search + Reporting + Dashboard + SEO — End-to-End Integration Plan

## Goal

Close the frontend/mobile/backend boundaries for four cross-cutting platform capabilities:

```text
Search
Reporting
Dashboard
SEO
```

Each capability must be usable from React and React Native, connect through authenticated HTTP/OpenAPI, integrate with the canonical NestJS services, and use real providers/adapters without leaking vendor SDKs into application code.

## Locked ownership

| Capability | Reusable package | Service owner | External providers |
|---|---|---|---|
| Search | `@stackra/search` | Search | Meilisearch / Elasticsearch / Algolia |
| Reporting | `@stackra/reporting` | Reporting | relational/read-model/Analytics contracts; export providers |
| Dashboard | `@stackra/dashboard` | host application/service | browser/native rendering; optional object storage for artifacts |
| SEO | `@stackra/seo` | host domain/application | Files/CDN for public media; HTTP/CDN for delivery |

No additional microservice is introduced for Dashboard or SEO. Application Registry remains Cloudflare Worker + Hono and is metadata/control-plane only.

## Shared dependency graph

```text
@stackra/contracts
      │
      ├── @stackra/http
      ├── @stackra/query
      ├── @stackra/pagination
      ├── @stackra/storage
      └── @stackra/security
            │
   ┌────────┼─────────┬──────────┐
   ▼        ▼         ▼          ▼
 Search  Reporting  Dashboard    SEO
   │        │         │          │
   └── React/React Native clients
```

## Search E2E

```text
Domain transaction
 → outbox
 → NATS JetStream
 → Search consumer
 → IndexJob
 → provider adapter
 → versioned index

Client
 → @stackra/search/react|react-native
 → @stackra/search/http
 → Gateway
 → Search API
 → query compiler
 → provider
 → normalized SearchResult
```

Acceptance requires at least one real Meilisearch or Elasticsearch environment. The provider adapter is the only layer allowed to import the vendor client. Frontend/mobile packages never receive engine credentials or engine-native query DSL.

## Reporting E2E

```text
Domain/Analytics events
 → Reporting projection
 → registered dataset
 → report definition/revision

React/Native Report Builder
 → dataset catalog
 → typed query AST
 → preview
 → save revision
 → run/query/export/schedule
 → Reporting API
 → safe compiler
 → read model/approved Analytics dataset
 → ReportResult
```

The same logical report definition powers preview, normal execution, dashboard widgets, exports and schedules. Dataset definitions are the security boundary for custom reports.

## Dashboard E2E

```text
DashboardProvider
 → GET dashboard document
 → host NestJS service
 → DashboardPersistenceAdapter
 → dashboards + immutable revisions

Widget
 → widget definition
 → report key / metric key / typed data endpoint
 → @stackra/http/@stackra/query
 → service
 → normalized widget data
 → renderer
```

The backend `@stackra/dashboard/nestjs` integration exposes persistence DTOs/adapters/controllers. It does not create a Dashboard service. Dashboards, revisions, grants and embeds live in the owning application's service database.

The attached Dashboard Studio reference establishes the minimum UX contract: widget catalogue/cohorts, configurable grid, customizer, multiple dashboards/tabs, presets, appearance, sharing/embed, kiosk/analytics views, widget error isolation and native primitives. The implementation plan deliberately converts those into provider-neutral platform contracts.

## SEO E2E

```text
Domain/Page/Template/Page Builder
 → SEO resolver
 → policy/default/locale/canonical resolution
 → SeoDocument
 →
   ├── React SSR/CSR head
   ├── OpenGraph/Twitter
   ├── JSON-LD
   ├── canonical/hreflang
   ├── robots.txt
   └── sitemap(s)
```

SEO data is generated from the published domain/page revision. A change emits a versioned invalidation signal so public cached metadata and affected sitemap segments can be rebuilt without requiring a dedicated SEO worker/service.

## Cross-capability integration rules

### Dashboard + Reporting

A dashboard widget stores:

```text
reportKey
parameterSchema
presentationHint
```

It does not store SQL or report-provider internals. Report result columns and semantic types tell the widget whether it can render as KPI, table, line chart, bar chart or list.

### Dashboard + Search

Search widgets use a search index key plus a portable search query. Search remains provider-neutral and authorization-aware. Results may be used for dashboard lists but business-critical permissions are revalidated by the domain service.

### Page Builder + Dashboard

Page Builder and Dashboard are separate capabilities. Page Builder controls arbitrary page composition; Dashboard controls authenticated workspace widgets and layouts. Both may reuse SDUI and shared component metadata but persist different document types.

### Page Builder + SEO

Page Builder exposes structured SEO fields and JSON-LD/resource hints. The SEO package validates them and combines them with domain defaults before publication.

### Search + SEO

Search can discover pages/products, while SEO decides whether a URL is public, canonical and indexable. Search indexing status is never treated as SEO indexability authority.

## API contracts

All public HTTP endpoints use:

```text
OpenAPI
typed DTOs
RequestContext
tenant isolation
IAM authorization
consistent pagination
ETag/conditional requests where appropriate
idempotency for mutating operations
```

No browser/mobile SDK bypasses the Gateway for normal product traffic.

## Versioning

Every persisted or indexed document carries an explicit schema/version. Report/dashboard/SEO publication captures the source revision that produced it. Search index versions are independent physical projections with alias cutover.

## Security model

```text
Identity → authenticated principal
Tenant   → mandatory context
IAM      → permission/field authorization
Domain  → business authorization
Package → validation/client/provider boundary
```

No package may invent a parallel authorization model.

## Operational reliability

All four capabilities require:

- bounded request and payload sizes;
- finite retries and jitter for transient dependencies;
- typed non-retryable errors;
- durable jobs for expensive work;
- idempotency keys/occurrence IDs;
- optimistic concurrency for editable documents;
- OTel correlation;
- structured operational metrics;
- tenant-safe cache keys;
- last-known-good public artifacts where replacement is batch-generated.

## Required integration test matrix

```text
React Search → Gateway → Search API → real provider
React Native Search → Gateway → Search API → real provider

React Report Builder → Reporting API → real read model
Report export → Files/object storage → signed download
Report schedule → scheduler → Notifications request

React Dashboard → Dashboard API → persistence → revision publish → reload
Widget → Reporting/Search API → rendered result
Public embed → token auth → read-only dashboard
React Native Dashboard → persistence → offline/read refresh path

Page/Domain → SEO resolver → SSR HTML
Page publication → SEO invalidation → sitemap/robots refresh
Locale change → hreflang/canonical update
```

## Non-goals

- Direct browser/mobile connections to search engines.
- Arbitrary SQL report builders.
- Dashboard microservice.
- SEO microservice.
- Dedicated SDUI Worker.
- Application Registry persistence of page/report/dashboard business data.

## Definition of complete

The four capabilities are complete only when the package plans, service plans, HTTP contracts and tests describe the entire request/event/persistence/provider path, with no undocumented handoff or vendor-specific escape hatch.
