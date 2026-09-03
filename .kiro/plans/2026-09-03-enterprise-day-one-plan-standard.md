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
```text
CAPABILITY = PACKAGE
PROVIDER / DRIVER = PACKAGE SUBPATH
RUNTIME INTEGRATION = PACKAGE SUBPATH
FRAMEWORK INTEGRATION = PACKAGE SUBPATH
TESTING INTEGRATION = PACKAGE SUBPATH
```
A separate package is allowed only where there is an independently meaningful ownership, lifecycle, dependency graph, deployment/runtime role or release boundary. Provider/framework adapters do not become separate roots.

## Package plan structure
Every package plan MUST define:
1. YAML frontmatter, status and ADRs/references
2. canonical package name and filesystem location
3. ownership, purpose and explicit non-goals
4. exact export map and public subpaths
5. exact source file/tree contract
6. public symbols with method signatures and behavior
7. DI/lifecycle/manager pattern where applicable
8. configuration keys and schema validation
9. discovery/registry behavior where applicable
10. provider/driver/adapter contracts and real implementations
11. runtime compatibility matrix
12. security, tenancy/isolation and data classification
13. typed errors, retryability, timeout, cancellation and recovery
14. concurrency/performance/resource limits
15. observability, metrics, traces and logging/redaction
16. persistence/storage/migrations where applicable
17. dependency graph and forbidden imports
18. unit/integration/conformance/security/failure/load/E2E tests
19. implementation phases with explicit files/contracts/tests per phase
20. migration/compatibility/rollback rules
21. production exit criteria

## Service plan structure
Each of the 14 service plans MUST additionally enumerate **every module** with:
- exact directory and file names;
- entities/value objects/invariants;
- commands and application services/methods;
- queries/read services/methods;
- repository ports and infrastructure implementations;
- HTTP controller class/file, route, method, DTO and authorization;
- emitted and consumed event types/version;
- queue/stream/subject names;
- durable job name, handler file, payload, retry/DLQ/timeout behavior;
- scheduler entry and occurrence/idempotency semantics;
- notification/email/Slack request type when applicable;
- persistence tables/indexes/migrations;
- tenancy and IAM rules;
- audit hooks;
- health/readiness impact;
- metrics/traces/log fields;
- integration/contract/security/E2E tests;
- deployment/runtime configuration.

The exact cross-service checklist is `.kiro/plans/2026-09-03-service-implementation-contract.md` and is mandatory for every service plan.

## Independent Cloudflare Worker plan structure
An independent Worker plan must explicitly define runtime, entrypoint, bindings, D1/KV/R2/Queues where used, unsupported Node APIs, state model, security/trust boundary, routing, Service Bindings, authenticated container calls, limits, deployment, migration, observability, failure behavior and Worker-native integration tests.

Application Registry, Gateway and Infrastructure Orchestrator are independent Cloudflare Workers under the current architecture. They are not generic replacements for service worker roles.

## Cross-service contracts
`@stackra/contracts` owns externally consumed DTOs, schemas, commands, queries, events, errors, enums and protocol interfaces. Consumers MUST NOT import another service's implementation, ORM entity, repository, provider or internal interface.

## Identity / tenancy / scope
Identity answers who is authenticated. Tenant owns tenant/organization/membership/domain data. IAM decides authorization. `@stackra/scope` is client context state and switcher UX. `@stackra/identity/session` handles reusable session integration. No frontend package may make a tenant ID an authorization decision.

## Search / reporting / dashboard / SEO
Search is provider-neutral and frontend/mobile clients use typed HTTP/OpenAPI; provider SDKs are backend-only subpaths. Reporting is definition/dataset/query-AST based and never exposes arbitrary SQL. Dashboard persistence is exposed through `/nestjs` integration while host services own database/publication. SEO spans backend resolution through React metadata, canonical/hreflang, JSON-LD, robots and sitemap.

## NestJS standard
NestJS is the canonical Node.js service framework. Use its modules/DI, lifecycle hooks, NATS integration, validation and OpenAPI capabilities rather than inventing parallel mechanisms.

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
`@stackra/logger` owns structured logs. `@stackra/observability` owns traces, metrics, propagation and instrumentation. Monitoring infrastructure owns collectors/dashboards/alerts/SLOs. Audit, Tracking, Analytics and Usage have distinct ownership.

## Testing
Use unit, integration, contract, adapter-conformance, runtime, security, failure/recovery, concurrency/load and deployment/readiness/shutdown tests where applicable. Real providers are required for release acceptance of provider-backed packages.

## Migration
Every plan defines compatibility, data/schema migration and rollback. Legacy aliases or target shims are not accepted as the target architecture.

## Exit rule
A plan is implementation-ready only when ownership, exact source location, public API, runtime/provider boundaries, security, tenancy, failure/recovery, observability, testing, deployment and migration are explicit and no competing legacy architecture remains.
