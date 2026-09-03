---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
status: canonical
---

# Figentra — 12-Month Enterprise Day-One Architecture & Implementation Plan

**Plan standard:** `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
**Service/runtime standard:** `.kiro/plans/01-global/service-worker-architecture.md`

This is the canonical cross-platform architecture plan. It governs package, service, worker, runtime, application, infrastructure and contract boundaries. Plans are implementation contracts, not prototypes.

## Core ownership law

```text
Package      = reusable technical/platform capability
Service      = bounded-context business/domain implementation
Worker role  = asynchronous execution role of its owning service
Contracts    = cross-service typed protocol boundary
Cloudflare   = explicit edge/serverless runtime, not generic background workers
```

A domain capability is **not** automatically a package. Business implementation lives in `services/<service>/src/modules`. A worker normally lives in the same service repository/source tree and is deployed as a distinct runtime role when asynchronous scaling or lifecycle requires it. A separate top-level worker application requires an explicit ADR proving an independent boundary.

## Canonical repository architecture

```text
apps/                         # product applications
services/                     # deployable bounded contexts
packages/                    # reusable platform/runtime libraries
workers/                     # exceptional independent workers only
infrastructure/              # Docker/Terraform/cloud operations
.kiro/specs/                 # component specifications
.kiro/plans/                 # implementation plans
.docs/adr/                   # architecture decisions
```

## Canonical package map

```text
packages/
├── base/
│   ├── contracts
│   ├── container
│   ├── support
│   ├── errors
│   ├── config
│   ├── logger
│   ├── observability
│   ├── storage
│   ├── cache
│   ├── database
│   ├── orm
│   ├── schema
│   ├── pagination
│   ├── state-machine
│   ├── pipeline
│   ├── http
│   ├── nats
│   ├── realtime
│   └── link
├── capabilities/
│   ├── identity       # reusable identity/authentication SDK boundary
│   └── tracking       # reusable client behavioral collection SDK
├── runtime/
│   ├── node
│   ├── nestjs
│   ├── browser
│   ├── react
│   ├── react-native
│   ├── desktop
│   └── worker
└── ui/
    ├── router
    ├── navigation
    ├── i18n
    ├── theming
    └── ui
```

The capabilities directory is deliberately small. Do not create package implementations for Notifications, Analytics, Marketing, Audit, Search, Media, Workflow, Query, State, Sync or other business bounded contexts merely to share code. Their implementations belong to services.

## Canonical service model

```text
services/
├── identity/
├── tenant/
├── scope/
├── iam/
├── policy/
├── approval/
├── monetization/
├── entitlements/
├── usage/
├── notifications/
├── audit/
├── files/
├── integrations/
├── reporting/
├── search/
└── workflow/
```

Each service owns its modules, domain logic, persistence, APIs, integrations and internal interfaces under `services/<service>/src/modules`.

## Service runtime roles

A service can produce multiple deployables from one source tree:

```text
services/notifications
   ├── API instance(s)
   └── worker/consumer instance(s)

services/analytics
   ├── API/query instance(s)
   └── ingestion/aggregation worker instance(s)
```

The role is selected at bootstrap/configuration time. The service may use NestJS HTTP, NATS microservices, event consumers and queue consumers. NestJS officially supports microservice transports, NATS queue groups and hybrid HTTP + microservice applications. citeturn0search1turn0search3turn2search7

A worker role MUST share the service's domain modules and contracts rather than becoming a duplicated implementation. It must support bounded concurrency, idempotency, retries/DLQ where applicable, graceful shutdown and readiness.

## Cloudflare boundary

Cloudflare Workers are not the default Figentra worker runtime. Use them only for workloads that benefit from edge/serverless execution or Cloudflare-native primitives. Conventional NestJS services and service worker roles run on Node.js/container infrastructure.

Cloudflare currently provides substantial Node.js API compatibility, including a growing set of built-in APIs, but Workers remain a distinct runtime with compatibility constraints; this does not turn a NestJS Node process into a native Cloudflare Worker. citeturn0search0turn0search13

## Contracts

`@stackra/contracts` is the only cross-service protocol package. It owns versioned DTOs, schemas, commands, queries, events, errors, enums and public protocol interfaces required by consumers.

```text
Service A
   │
   ├── imports @stackra/contracts/foo
   │
   ▼
Typed protocol
   ▲
   │
Service B implementation
```

Consumers never import another service's implementation, repository, ORM entity, provider SDK or internal interface.

Internal implementation interfaces remain inside the owning service. Provider-specific SDK types remain behind adapters.

## Identity/authentication

`@stackra/identity` is the reusable identity/authentication SDK boundary where reuse is real. It owns authentication orchestration, provider adapters, principal normalization and identity context. Supabase Auth is the day-one human authentication provider. There is no standalone `@stackra/auth` target.

The Identity service owns authoritative Figentra-side principal/session/identity state. IAM and Policy own authorization decisions.

## Operational telemetry and product signals

```text
@stackra/logger
  → structured logs

@stackra/observability
  → OpenTelemetry traces, metrics, propagation, instrumentation

@stackra/tracking
  → behavioral/product/ad event collection SDK

Analytics service
  → durable analytical ingestion, aggregation, attribution, queries

Marketing service
  → audiences, campaigns, journeys, activation

Audit service
  → immutable security/business audit records
```

These concerns are intentionally separate. Logs are not audit records, traces are not tracking, tracking is not domain events, analytics is not marketing, and audit is not operational telemetry.

## Infrastructure and monitoring

Monitoring is an operational consumption layer, not a business package. Instrumentation belongs to observability; collectors, storage, dashboards, alerts, SLOs and on-call configuration belong to infrastructure.

Docker and Terraform are first-class infrastructure tooling. Development, staging and production have isolated configuration/state. Production telemetry must have retention, access control, secret management, backup/DR where required, alert validation and failure-mode tests.

## Storage/database/ORM law

- Storage is not cache.
- Database owns connections, lifecycle, transactions, health and DB-level routing/migrations.
- ORM owns mapping, repositories, identity map/unit-of-work and persistence behavior.
- Object storage, filesystem, secure storage and key/value storage remain explicit adapters.

## Discovery and construction

Use one platform-wide lifecycle vocabulary:

```text
Discovery → finds metadata
Registry  → stores/indexes metadata
Populator → populates registry
Factory   → constructs instances
Adapter   → translates boundaries
Provider  → integrates construction with DI
Manager   → orchestrates operations
```

No duplicate discovery systems or duplicate canonical identifiers.

## NestJS enterprise baseline

Every NestJS service/role follows the platform baseline:

- explicit bootstrap/runtime role;
- modular architecture aligned to bounded contexts;
- dependency injection and explicit providers;
- Fastify where required by the repository standard;
- global runtime validation using the canonical schema/validation policy;
- versioned OpenAPI for HTTP APIs;
- NATS request/response and event-based messaging where applicable;
- queue groups/consumer groups for horizontal worker scaling;
- correlation/request/trace propagation;
- structured JSON logging;
- OpenTelemetry instrumentation;
- readiness/liveness semantics appropriate to API or worker role;
- graceful shutdown and connection draining;
- bounded concurrency, timeouts, cancellation, retries and idempotency;
- tenant isolation and service authentication;
- no secrets in logs/telemetry;
- contract, integration, end-to-end and conformance testing;
- immutable container builds and automated deployment.

NestJS explicitly documents production deployment, health checks, logging, observability, scaling, Dockerization, validation, OpenAPI and lifecycle shutdown hooks as production concerns. citeturn2search6turn2search4turn2search0turn2search1

## Mandatory package-plan standard

Every reusable package plan must define complete public API, exports, internal file structure, contracts, DI tokens, lifecycle/scopes, configuration, adapters/providers, discovery, runtime matrix, security, errors/recovery, observability, concurrency/resource limits, tenancy/isolation where applicable, persistence/migrations, compatibility, tests, versioning and phase exit criteria.

No target architecture may be left as a TODO, placeholder provider, fake production driver, target shim or deferred redesign.

## Mandatory service-plan standard

Every service plan must define:

1. bounded-context ownership;
2. module tree under `src/modules`;
3. HTTP/control-plane API;
4. NATS/event/queue contracts;
5. persistence and migrations;
6. internal interfaces and provider adapters;
7. API/consumer/worker/scheduler role bootstraps;
8. idempotency, retries, DLQ and reconciliation;
9. security and tenant isolation;
10. audit and observability integration;
11. health/readiness and graceful shutdown;
12. scaling/resource limits;
13. testing and contract conformance;
14. deployment and rollback.

## Definition of done

The complete plan set is ready for implementation only when each component has one canonical owner, every cross-service dependency is represented by a versioned contract, asynchronous execution has a clear owning service and runtime role, package reuse is justified, infrastructure is reproducible, and no competing legacy architecture remains.

## Cross-references

- `.kiro/plans/01-global/service-worker-architecture.md`
- `.kiro/plans/01-global/infrastructure-docker-terraform.md`
- `.kiro/plans/01-global/monitoring-infrastructure.md`
- `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`
- `.kiro/plans/services/README.md`
- `.kiro/plans/packages/README.md`
- `.kiro/specs/figentra-platform/INDEX.md`
- `.docs/adr/ADR-0012-versioned-contracts.md`
- `.docs/adr/ADR-0020-worker-structure-and-infrastructure-orchestrator.md`
- `.docs/adr/ADR-0022-service-communication.md`
