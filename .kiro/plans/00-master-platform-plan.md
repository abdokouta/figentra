---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# Figentra — 12-Month Enterprise Day-One Architecture & Implementation Plan

**Status:** Canonical cross-package plan  
**Plan standard:** `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`

This directory is the canonical planning surface for the Figentra monorepo/framework. Every package plan must follow the repository's established dated-plan structure, existing steering standards, and applicable ADRs. Package plans are implementation contracts, not prototypes.

## Planning rules

- Plans describe production-ready architecture, not placeholders or deferred redesigns.
- Every package defines its complete public API, internal structure, dependencies, contracts, DI tokens, runtime adapters, configuration, security, observability, errors, testing, migration and release behavior before implementation.
- Contracts are owned centrally by `@stackra/contracts`.
- Dependency direction is contracts → foundation → capabilities → runtime adapters → applications.
- Runtime-neutral core packages must not import framework/runtime globals.
- Storage and cache are distinct concerns; filesystem I/O and object storage are separate operational capabilities even when exposed through a common storage vocabulary.
- Database owns connectivity, transactions, lifecycle and database-level operations; ORM owns mapping, repositories and persistence behavior.
- Discovery finds metadata; registries own storage/indexing; populators perform population; factories construct instances; adapters translate boundaries; providers integrate with DI; managers orchestrate.
- Request scope is explicit and context-bound; no hidden ambient global request state.
- Security, observability, failure recovery, conformance tests and public exports are day-one requirements.
- Compatibility adapters may exist only for an explicit migration boundary. Compatibility code must never become the target architecture.
- No architecture may be left as TODO, stub, shim, placeholder provider, fake production driver or post-implementation redesign.

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
│   ├── events
│   ├── identity
│   ├── queue
│   ├── sync
│   ├── search
│   ├── media
│   ├── notifications
│   ├── analytics
│   ├── marketing
│   ├── workflow
│   ├── query
│   └── state
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
    ├── tracking
    └── ui
```

### Identity/auth boundary

Authentication and identity are one platform bounded context, exposed through `@stackra/identity`. The package owns authentication orchestration, provider adapters, principal normalization, sessions, credentials/tokens, service identities and identity context. Supabase Auth remains the day-one human authentication provider; its provider state is external to Figentra. There is **no independent `@stackra/auth` capability** in the target architecture. IAM/Policy remains a separate authorization boundary.

The old standalone `@stackra/auth` plan is therefore a migration/merge artifact only and must not be implemented as a separate package.

### Telemetry/analytics boundary

Figentra has four intentionally separate concerns:

```text
Operational telemetry
  = logs + metrics + traces + runtime/resource signals
  → @stackra/observability + @stackra/logger

Product/ad behavioral collection
  = track/identify/page/screen/campaign/conversion events + consent
  → @stackra/tracking

Analytics
  = durable ingestion + aggregation + attribution + analytical queries/read models
  → @stackra/analytics

Marketing
  = audiences + campaigns + journeys + activation + server-side conversion delivery
  → @stackra/marketing
```

These are not interchangeable. Logs are not analytics; traces are not tracking; tracking events are not domain events; analytics is not marketing; audit is not any of the above.

`@stackra/events` remains the domain/application fact transport. `@stackra/queue` and `@stackra/nats` transport work/events but do not own analytics or marketing semantics.

### Runtime placement

Capabilities are runtime-neutral. NestJS is the primary control-plane/application API runtime; Worker runtimes execute edge/background workloads where they fit; dedicated workers execute asynchronous data-plane processing.

```text
NestJS / HTTP
  → commands, queries, admin/control APIs, webhooks

NATS / Queue
  → durable asynchronous work

Worker / background runtime
  → ingestion, aggregation, campaign evaluation, notification delivery,
    indexing, integrations, retries and scheduled work
```

A capability plan MUST specify which operations are synchronous control-plane operations and which are asynchronous worker operations. A capability must not become NestJS-only merely because its service exposes an HTTP API.

## Dependency law

```text
@stackra/contracts
        ↓
container / errors / support / config
        ↓
logger / observability / storage / cache / database / schema / pipeline
        ↓
orm / http / nats / realtime / pagination / state-machine / link
        ↓
events / identity / queue / sync / search / media / notifications
        / analytics / marketing / workflow / query / state
        ↓
runtime adapters + UI
        ↓
applications
```

Forbidden regressions include ORM-owned database connection policy, routing inside link/error packages, cache being treated as durable storage, framework dependencies leaking into runtime-neutral cores, duplicate discovery implementations, duplicated canonical identifiers, analytics logic inside tracking SDKs, marketing activation inside analytics ingestion, and application code depending directly on vendor telemetry SDKs.

## Mandatory plan structure

Every package plan follows `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md` and therefore documents, in order:

1. frontmatter and ownership metadata
2. status, ADR anchors, references and dependencies
3. purpose and non-goals
4. manager pattern where applicable
5. complete subpath/file layout
6. contracts split and DI tokens
7. locked public API/export map
8. execution/lifecycle model
9. drivers/adapters/providers
10. configuration and validation
11. discovery/registry behavior
12. runtime matrix
13. security
14. errors/recovery
15. observability
16. concurrency/performance/resource limits
17. enterprise/tenancy/isolation rules
18. persistence/migrations/compatibility
19. testing/conformance/runtime matrix
20. dependencies/exports/versioning
21. implementation phases with completion gates
22. exit criteria and cross-references

## Canonical signal ownership

| Concern | Canonical owner | Must not own |
|---|---|---|
| Structured application logs | `@stackra/logger` | business analytics, audit persistence |
| OTel SDK/context/export/instrumentation | `@stackra/observability` | product tracking, campaign logic |
| Metrics | `@stackra/observability` | billing usage semantics |
| Distributed tracing | `@stackra/observability` | user journey analytics |
| Runtime/resource monitoring signals | `@stackra/observability` + infrastructure | product reporting |
| Security/business audit | audit capability/service | operational logs/traces |
| Domain/application events | `@stackra/events` | telemetry implementation |
| Client/product/ad tracking | `@stackra/tracking` | durable analytics warehouse |
| Analytics ingestion/aggregation/query | `@stackra/analytics` | notification delivery/campaign activation |
| Marketing campaigns/audiences/activation | `@stackra/marketing` | operational telemetry |
| Billable usage/metering | existing Usage service/capability | generic analytics |
| Notification delivery | `@stackra/notifications` | marketing campaign ownership |

## Observability contract

OpenTelemetry is the canonical cross-runtime telemetry model for traces, metrics and telemetry context, with logs correlated to the same execution/resource context. The implementation follows OTel semantic conventions rather than inventing Figentra-specific replacements.

Every runtime propagates, where applicable:

```text
trace_id
span_id
trace_state
request_id
correlation_id
causation_id
service.name
service.version
deployment.environment.name
tenant_id (safe/allowlisted)
principal_id (safe/allowlisted)
```

High-cardinality identifiers and PII MUST NOT become unbounded metric labels. Sensitive fields are centrally redacted before logs or telemetry leave the process. Business telemetry must never contain credentials, access tokens, cookies, authorization headers or raw secrets.

### Monitoring is an operational consumer, not another application capability

"Monitoring" means collection, storage, dashboards, alert rules, SLOs and on-call workflows over operational telemetry. It is not a second `monitoring` package. Runtime instrumentation belongs to `@stackra/observability`; backend/collector deployment and dashboards belong to infrastructure/operations plans; alert definitions are version-controlled operational configuration.

## Storage boundary

`@stackra/storage` is the canonical storage vocabulary, but the plan must preserve the repository's explicit operational distinction between key/value storage, secure storage, filesystem storage and object storage. Durable storage is not cache. Filesystem operations must not be implemented as cache behavior, and object-storage adapters must not leak vendor APIs into application code.

## Cross-package requirements

Every package plan must define:

- exact package exports and forbidden deep imports
- contracts and token ownership
- lifecycle and scope
- configuration schema and startup validation
- adapter selection and registration
- error taxonomy, retryability, timeout and cancellation
- authentication/authorization and tenant isolation where applicable
- secret/redaction rules
- logs, metrics and tracing hooks
- rate limits, backpressure and resource limits
- adapter conformance tests
- runtime-specific behavior for Browser, React Native, Node/NestJS, Desktop and Worker where applicable
- migration and rollback constraints
- documentation and examples
- release/versioning/change-management requirements

## Implementation sequencing

Foundation packages are implemented first only because downstream packages depend on their contracts. This does not defer downstream architecture: all downstream package plans must be complete before implementation starts.

Recommended dependency sequence:

1. contracts
2. container
3. support
4. errors
5. config
6. logger + observability
7. storage
8. cache
9. database
10. orm
11. schema
12. pagination
13. pipeline/state-machine
14. HTTP/NATS/realtime/link
15. events + identity
16. queue
17. notifications/sync/search/media
18. tracking + analytics
19. marketing/workflow/query/state
20. runtime adapters
21. UI/runtime integration
22. cross-package conformance and release verification

## Definition of done

A package plan is implementation-ready only when an engineer can create the package without inventing architecture during coding. The plan must provide concrete interfaces/types, dependency rules, adapter boundaries, file-level structure, lifecycle semantics, tests, security controls, operational behavior, acceptance criteria and migration/release constraints.

## Related repository standards and ADRs

All plans must remain aligned with `.kiro/steering/*` and the repository ADR set under `.docs/adr`, including decisions governing contracts, identity, transport, NATS, Worker runtime, package standardization, service boundaries, environment identifiers and application/service architecture.
