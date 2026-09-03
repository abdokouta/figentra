# Canonical Package Plan Index

Every reusable package has exactly one comprehensive implementation plan under this tree. A file is canonical only when it defines ownership, public API, source layout, adapters/providers, configuration, security, tenancy where applicable, failure/recovery, observability, persistence where applicable, testing, versioning and completion criteria.

## Package boundary law

```text
CAPABILITY = PACKAGE
PROVIDER / DRIVER = PACKAGE SUBPATH
RUNTIME INTEGRATION = PACKAGE SUBPATH
FRAMEWORK INTEGRATION = PACKAGE SUBPATH
TESTING INTEGRATION = PACKAGE SUBPATH
```

A standalone package is permitted only when it has an independently meaningful ownership, lifecycle, dependency graph, deployment/runtime role, or release boundary. Do not split `cache/redis`, `http/axios`, `logger/nestjs`, `storage/filesystem`, `query/react`, etc. into separate packages.

## Base

`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`, `events`, `security`, `coordinator`

## Capabilities

`identity`, `tracking`, `workflow`, `sync`, `queue`, `query`, `state`, `media`, `search`, `reporting`, `dashboard`, `audit`, `sdui`, `page-builder`, `seo`

Capability packages may expose runtime/framework/provider/testing subpaths. `audit` is a reusable client/contract boundary; the Audit service remains the authoritative durable audit owner. `search` is the provider-neutral client/adapter boundary; the Search service owns index lifecycle. `reporting` is the typed report client/builder contract; Reporting owns definitions, projections and execution. `dashboard` owns dashboard documents, widgets and presentation behavior; host services own persistence. `seo` provides the cross-layer SEO contract from domain/backend resolution to web rendering and sitemap/robots output. `sdui` owns the controlled runtime document/schema contract; `page-builder` owns visual authoring.

## Runtime foundations

`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`

These remain standalone only because they provide shared runtime/foundation behavior across multiple capabilities. Feature-specific integrations belong in the capability package as subpaths.

## Tooling

`build`, `testing`, `console`, `vite`, `openapi` where implemented

## UI

`router`, `navigation`, `i18n`, `theming`, `ui`

## Ownership rules

- Business/domain implementations belong to services.
- `@stackra/workflow` is the workflow definition/execution SDK; durable orchestration belongs to the Workflow service.
- Service workers, consumers and schedulers are roles of their owning NestJS service. Independent workers require an ADR/spec boundary.
- Cross-service DTOs, commands, queries, events and errors belong to `@stackra/contracts`.
- Cache is ephemeral; durable state belongs to database/object storage.
- Observability is operational telemetry; Audit is the durable governance record.
- Runtime foundation packages are not duplicated as per-capability packages.
- Application Registry is an independent Cloudflare Worker + Hono control-plane runtime. It stores sanitized application metadata projections and never owns page documents.
- SDUI is a controlled schema-driven rendering contract; it never transports executable code.
- Page Builder edits typed documents rather than React/DOM trees. The owning NestJS service owns pages, revisions and publication.
- Search clients never connect directly to search-engine infrastructure from browser/mobile runtimes; they use the authenticated HTTP contract. Provider SDKs live only under `@stackra/search/*` backend subpaths.
- Reporting custom reports use registered datasets and a typed query AST; raw SQL is never a client contract.
- Dashboard persistence is injected through `@stackra/dashboard/nestjs`; no Dashboard microservice is required.
- SEO is a cross-layer capability, not a standalone service; domain services remain authoritative for the resources being indexed.

## Consolidation targets

- Redis → `@stackra/cache/redis`
- filesystem storage → `@stackra/storage/filesystem`
- encryption/hash primitives → `@stackra/security/*`
- HTTP response/transport helpers → `@stackra/http/*`
- exceptions → `@stackra/errors/*`
- queue providers → `@stackra/queue/*`
- search providers → `@stackra/search/*`

## Completeness gate

No package plan may contain placeholder architecture, unresolved driver, fake production provider, `TODO`, `TBD`, “define later” contract or target shim. Every public symbol must have a type, behavior, failure semantics and conformance tests specified before implementation.
