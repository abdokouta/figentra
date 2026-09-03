---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-standard
status: canonical
---

# Figentra Enterprise Day-One Plan Standard

**Status:** Mandatory architecture standard  
**Applies to:** Packages, services, service runtime roles, independent Workers, applications and infrastructure plans

## Purpose

Every plan is a production implementation contract, not a feature wishlist or prototype roadmap. Implementation must be possible without inventing architecture during coding. Phases describe implementation order only; they never defer architecture.

## Ownership model

```text
Package     = reusable technical/platform capability
Service     = bounded-context business/domain implementation
Worker role = async execution role of owning NestJS service
Edge Worker = explicit Cloudflare/serverless workload
Contracts   = cross-service typed protocol boundary
```

Business code belongs under `services/<service>/src/modules`. A service may expose API, consumer, worker and scheduler roles from the same NestJS source tree. A separate worker requires an explicit independent runtime/deployment boundary.

## Package boundary rule

The default decomposition is:

```text
CAPABILITY = PACKAGE
PROVIDER / DRIVER = PACKAGE SUBPATH
RUNTIME INTEGRATION = PACKAGE SUBPATH
FRAMEWORK INTEGRATION = PACKAGE SUBPATH
TESTING INTEGRATION = PACKAGE SUBPATH
```

Examples:

```text
@stackra/cache
@stackra/cache/redis
@stackra/cache/worker
@stackra/cache/react
@stackra/cache/testing

@stackra/http
@stackra/http/fetch
@stackra/http/axios
@stackra/http/nestjs
@stackra/http/react
@stackra/http/worker
@stackra/http/testing
```

A separate package is allowed only where there is an independently meaningful ownership, lifecycle, dependency graph, deployment/runtime role or release boundary. Do not create one package per provider or framework adapter.

Root exports MUST stay runtime-neutral unless the package itself is a runtime foundation. Optional provider/framework dependencies are isolated behind explicit subpath exports and may be peer/optional dependencies as appropriate.

## Package plan structure

1. YAML frontmatter
2. title/status/ADRs/references/dependencies
3. ownership/purpose
4. non-goals
5. manager pattern where applicable
6. exact subpath/source layout
7. contract split
8. locked public API/export map
9. core architecture/execution
10. drivers/adapters/providers
11. configuration/validation
12. discovery/registry
13. runtime matrix
14. security
15. errors/recovery
16. observability
17. concurrency/performance/resource limits
18. tenancy/isolation where applicable
19. persistence/migrations/compatibility where applicable
20. testing/conformance
21. dependencies/exports/versioning
22. implementation phases with files/contracts/tests/security/observability/migration
23. exit criteria
24. cross-references

## Service plan structure

1. bounded-context ownership and invariants
2. explicit module tree under `src/modules`
3. domain/application/infrastructure boundaries
4. HTTP API
5. NATS/event/queue contracts
6. persistence/migrations
7. internal interfaces/provider adapters
8. role bootstrap (`api`, `consumer`, `worker`, `scheduler` as required)
9. idempotency/retries/DLQ/reconciliation
10. authentication/authorization/tenant isolation
11. audit/observability
12. health/readiness/graceful shutdown
13. concurrency/resource limits/scaling
14. tests/conformance
15. deployment/rollback
16. phases/exit criteria

## Independent Cloudflare Worker plan structure

An independent Worker plan must explicitly define runtime, entrypoint, bindings, D1/KV/R2/Queues where used, unsupported Node APIs, state model, security/trust boundary, routing, Service Bindings, authenticated container calls, limits, deployment, migration, observability, failure behavior and Worker-native integration tests.

Application Registry, Gateway and Infrastructure Orchestrator are independent Cloudflare Workers under the current architecture. They are not generic replacements for service worker roles.

## Cross-service contracts

`@stackra/contracts` owns externally consumed DTOs, schemas, commands, queries, events, errors, enums and protocol interfaces. Consumers MUST NOT import another service's implementation, ORM entity, repository, provider or internal interface.

## NestJS standard

NestJS is the canonical Node.js service framework. Use its modules/DI, lifecycle hooks, microservice transports, NATS integration, validation and OpenAPI capabilities rather than inventing parallel mechanisms.

## Identity/security standard

Supabase Auth is the day-one human authentication provider. `@stackra/identity` is the authentication/identity boundary. IAM owns authorization and policy evaluation. Monetization owns commercial entitlements. Authentication, authorization and commercial checks remain distinct.

## Discovery vocabulary

```text
Discovery → locate metadata
Registry  → store/index metadata
Populator → populate from source
Factory   → construct instances
Adapter   → translate external/runtime representations
Provider  → DI construction
Manager   → orchestrate lifecycle/multiple instances
```

## Runtime worker rules

Service worker roles use the owning NestJS source tree, bounded concurrency, idempotency, retry budgets, DLQ/reconciliation, readiness and graceful shutdown. Independent `workers/<service>` applications are forbidden without an ADR.

## Configuration

Configuration is schema-validated before use. Secrets never enter source, logs, client bundles or ordinary persisted state. Unsafe production configuration fails closed unless a documented safe degraded mode exists.

## Errors/recovery

Plans define typed errors, retryability, cancellation, timeout semantics, transport mapping, idempotency and recovery after restart. Distributed operations must have explicit replay/reconciliation behavior.

## Observability

`@stackra/logger` owns structured logs. `@stackra/observability` owns traces, metrics, propagation and instrumentation. Monitoring infrastructure owns collectors/dashboards/alerts/SLOs. Audit and tracking are separate durable/business signals.

## Testing

Use unit, integration, contract, adapter-conformance, runtime, security, failure/recovery, concurrency/load and deployment/readiness/shutdown tests where applicable. Real providers are required for release acceptance of provider-backed packages.

## Migration

Every plan defines compatibility, data/schema migration and rollback. Legacy aliases or target shims are not accepted as the target architecture.

## Exit rule

A plan is implementation-ready only when ownership, exact source location, public API, runtime/provider boundaries, security, tenancy, failure/recovery, observability, testing, deployment and migration are explicit and no competing legacy architecture remains.
