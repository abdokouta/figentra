---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
scope: all-requested-packages
---
# Figentra Package Catalog — Canonical Ownership, Paths, Files and E2E Boundaries

This file is the authoritative mapping for every requested package name. A requested name is not automatically a standalone npm package. The package-boundary law is: capability → package; provider/driver/runtime/framework/testing integration → subpath. Every entry below has a canonical implementation location and a plan owner.

## Identity, tenancy and session

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `identity` | `packages/capabilities/identity` | authentication, principal, credentials, identity links and identity context |
| `scope` | `packages/capabilities/scope` | active tenant/workspace/resource context and switchers; never tenant ownership |
| `session` | `@stackra/identity/session` | client/server session lifecycle integration; Identity service owns durable sessions |
| `consent` | `packages/capabilities/consent` | consent categories, purposes, state and runtime enforcement contracts |
| `cookie` | `packages/base/http/cookie` | secure cookie parsing/serialization and policy helpers |

Flow:
```text
identity/session → principal → Tenant service memberships → IAM authorization → scope → HTTP/query/cache context
```
Identity must not become a tenant domain service. Tenant remains one of the canonical 14 services. Scope is UX/context state, not a second tenancy database.

## Search, indexing and discovery

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `search` | `packages/capabilities/search` | normalized query/index client and provider adapters |
| `indexer` | `packages/capabilities/search/indexer` | reusable indexing pipeline primitives; Search service owns index lifecycle |
| `ai` | `packages/capabilities/ai` | model-neutral AI execution/tool/RAG client contracts |
| `pubsub` | `packages/base/nats/pubsub` | transport-neutral pub/sub facade over canonical messaging |

Vendor adapters remain under `@stackra/search/meilisearch`, `/elastic`, `/algolia`. No frontend or mobile client receives provider credentials or native DSL. Search service is the only owner of durable index metadata/rebuild/reconciliation state.

## Reporting, dashboard and page experience

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `dashboard` | `packages/capabilities/dashboard` | dashboard document/widget/layout client capability |
| `report` | service capability `Reporting` + optional `@stackra/reporting` client subpaths | Reporting service owns definitions/read models/jobs |
| `page-builder` | `packages/capabilities/page-builder` | typed visual authoring; host service owns persistence/publication |
| `sdui` | `packages/capabilities/sdui` | controlled schema/runtime document/rendering contract |
| `seo` | `packages/capabilities/seo` | cross-runtime SEO document/resolution/rendering contracts |

Dashboard persistence is exposed from `@stackra/dashboard/nestjs`; it does not create a Dashboard service. Page Builder never stores DOM/React trees.

## Transport, reliability and infrastructure

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `cache` | `packages/base/cache` | cache abstraction |
| `redis` | `@stackra/cache/redis` | Redis provider adapter; not a package root |
| `config` | `packages/base/config` | typed configuration and secret references |
| `network` | `@stackra/http/network` | connectivity/transport helpers; no duplicate HTTP client package |
| `http` | `packages/base/http` | HTTP core, clients, middleware, interceptors and transport contracts |
| `response` | `@stackra/http/response` | response envelope/normalization subpath |
| `rate-limit` | `packages/base/http/rate-limit` | provider-neutral rate-limiter contract + Redis/edge adapters |
| `queue` | `packages/capabilities/queue` | queues, retries, DLQ, jobs and provider adapters |
| `scheduler` | `packages/capabilities/scheduler` | schedule definitions, leases, due-time evaluation and scheduler client primitives |
| `realtime` | `packages/base/realtime` | realtime transport contract and adapters |
| `webhook` | `packages/capabilities/webhook` | signed inbound/outbound webhook contracts and delivery helpers |

## Security and platform policy

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `encryption` | `@stackra/security/encryption` | envelope/field encryption primitives |
| `hashing` | `@stackra/security/hashing` | password/token/content hashing primitives |
| `csp` | `@stackra/security/csp` | CSP policy construction and nonce/hash handling |
| `swagger` | `packages/tooling/openapi/swagger` | documentation generation, never runtime HTTP ownership |
| `versioning` | `packages/base/contracts/versioning` | API/schema/contract version policies |
| `health` | `packages/base/health` | readiness/liveness/health contracts |
| `tracing` | `@stackra/observability/tracing` | OTel tracing integration; not a standalone telemetry system |

## Frontend/mobile/platform experience

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `i18n` | `packages/ui/i18n` | localization primitives |
| `theming` | `packages/ui/theming` | theme/tokens |
| `router` | `packages/ui/router` | route model + guards |
| `pwa` | `packages/capabilities/pwa` | service worker/install/offline/update contracts for web apps |
| `kbd` | `packages/ui/kbd` | keyboard shortcuts/command surface primitives |
| `desktop` | `packages/runtime/desktop` | desktop runtime foundation |
| `collaboration` | `packages/capabilities/collaboration` | presence/cursors/CRDT or command-stream collaboration contracts |
| `tracking` | `packages/capabilities/tracking` | behavioral collection |
| `sync` | `packages/capabilities/sync` | offline synchronization |
| `state` | `packages/capabilities/state` | local reactive state |
| `query` | `packages/capabilities/query` | server-state querying/mutations |

## Developer platform and communication

| Requested | Canonical implementation | Ownership |
|---|---|---|
| `container` | `packages/base/container` | DI/container core |
| `contracts` | `packages/base/contracts` | cross-service contracts |
| `events` | `packages/base/events` | business event envelope/registry |
| `pipeline` | `packages/base/pipeline` | generic execution pipeline |
| `pagination` | `packages/base/pagination` | pagination contracts |
| `orm` | `packages/base/orm` | ORM abstraction/identity-map/UoW integration |
| `storage` | `packages/base/storage` | durable storage abstractions |
| `media` | `packages/capabilities/media` | media ingestion/processing |
| `logger` | `packages/base/logger` | structured logging |
| `support` | `packages/base/support` | shared support primitives |
| `coordinator` | `packages/base/coordinator` | bounded orchestration coordination, not business workflow |
| `console` | `packages/tooling/console` | CLI/console framework |
| `testing` | `packages/tooling/testing` | test harnesses/conformance helpers |
| `email` | `@stackra/notifications/email` | email provider/delivery adapter; Notifications owns delivery |
| `slack` | `@stackra/notifications/slack` | Slack provider/delivery adapter; Notifications owns delivery |

## Architectural rule for domain-looking names

No package becomes the source of truth merely because its name sounds like a domain. `Tenant`, `IAM`, `Search`, `Reporting`, `Notifications`, `Files`, `Integrations`, `Analytics`, `Marketing`, etc. remain services. A reusable package may expose contracts or clients for them, but business persistence stays in the service.

## Required file shape for every package

```text
packages/<category>/<package>/
├── package.json
├── README.md
├── src/
│   ├── core/                 # runtime-neutral contracts/logic
│   ├── <provider>/           # optional provider subpaths
│   ├── <runtime>/            # node/react/native/worker as applicable
│   ├── <framework>/          # nestjs as applicable
│   ├── testing/              # conformance and fixtures
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── conformance/
│   ├── security/
│   └── e2e/
└── docs/                     # only when package-specific reference docs are substantial
```

Every package plan must additionally specify exact export map, dependency graph, configuration keys, runtime compatibility, public methods/types, exceptions and retryability, observability, tenancy context, security policy, versioning/migrations and production exit criteria.

## No hidden standalone roots

The following requested names are intentionally subpaths, not package roots: `redis`, `network`, `response`, `session`, `email`, `slack`, `encryption`, `hashing`, `csp`, `tracing`, `swagger`, `versioning`, `indexer`, `pubsub`.
