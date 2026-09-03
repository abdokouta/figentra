# Canonical Package Plan Index

Every reusable package has exactly one comprehensive implementation plan under this tree. A file is canonical only when it defines ownership, public API, exact source layout, adapters/providers, configuration, security, tenancy where applicable, failure/recovery, observability, persistence where applicable, testing, versioning and completion criteria.

## Boundary law
```text
CAPABILITY = PACKAGE
PROVIDER / DRIVER = PACKAGE SUBPATH
RUNTIME INTEGRATION = PACKAGE SUBPATH
FRAMEWORK INTEGRATION = PACKAGE SUBPATH
TESTING INTEGRATION = PACKAGE SUBPATH
```
A standalone package is allowed only when it has independent ownership, lifecycle, dependency graph, deployment/runtime role, or release boundary.

## Base
`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`, `events`, `security`, `coordinator`, `health`

## Capabilities
`identity`, `scope`, `tracking`, `workflow`, `sync`, `queue`, `scheduler`, `query`, `state`, `media`, `search`, `audit`, `sdui`, `page-builder`, `dashboard`, `seo`, `pwa`, `kbd`, `ai`, `collaboration`, `consent`, `webhook`

## Runtime foundations
`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`

## Tooling
`build`, `testing`, `console`, `vite`, `openapi` / `swagger`

## UI
`router`, `navigation`, `i18n`, `theming`, `ui`

## Canonical subpaths (not standalone package roots)
```text
@stackra/cache/redis
@stackra/http/network
@stackra/http/response
@stackra/http/rate-limit
@stackra/http/cookie
@stackra/security/encryption
@stackra/security/hashing
@stackra/security/csp
@stackra/observability/tracing
@stackra/contracts/versioning
@stackra/search/indexer
@stackra/nats/pubsub
@stackra/identity/session
@stackra/notifications/email
@stackra/notifications/slack
@stackra/openapi/swagger
```

## Identity / tenancy rule
`@stackra/identity` owns authentication and principal/session orchestration. The Tenant service owns tenant/organization/membership/domain data. `@stackra/scope` is the client context/switcher package: `ScopeProvider`, `useScope`, tenant/workspace switchers and context propagation. Scope never stores authoritative tenant membership or authorization.

## Search / reporting / dashboard / SEO
- Search package is provider-neutral and connects React/Native → HTTP/OpenAPI → Search service → real provider adapters. Search service owns index lifecycle.
- Reporting is a service-owned domain with a reusable client; report definitions use an allowlisted query AST and dataset contracts, never raw SQL.
- Dashboard owns client document/widget/layout contracts; `@stackra/dashboard/nestjs` provides persistence/controller adapters. The host service owns database and publication.
- SEO owns normalized SEO documents and rendering/generation contracts from domain/page revisions through React SSR, canonical/hreflang, JSON-LD, robots and sitemaps.

## Service implementation standard
All 14 services must enumerate, per module: exact source files, entities/value objects, commands/queries/application methods, DTOs/controllers, repository ports/adapters, emitted/consumed events, queue subjects, durable jobs, scheduler entries, notifications/email requests, authz rules, tenancy isolation, audit hooks, metrics/traces, health/readiness, migrations, unit/integration/contract/e2e/load/security tests and deployment configuration. The canonical checklist is `.kiro/plans/2026-09-03-service-implementation-contract.md`.

## Exact package plan requirement
Every package plan must state package name, canonical directory, export map, source tree, runtime/framework/provider subpaths, public symbols and signatures, configuration keys, security/tenancy, lifecycle/DI, failure semantics/retries, observability, testing/conformance, versioning/migrations and exit criteria. No placeholder architecture, fake production driver, target shim, or unresolved provider is accepted.
