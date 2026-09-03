---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-standard
status: canonical
---

# Figentra Enterprise Day-One Plan Standard

**Status:** Mandatory architecture standard
**Applies to:** Packages, services, service runtime roles, workers, applications and infrastructure plans

## Purpose

Every plan is a production implementation contract, not a feature wishlist or prototype roadmap. Implementation must be possible without inventing architecture during coding.

Phases describe implementation order only. They do not defer architecture.

## Ownership model

```text
Package     = reusable technical/platform capability
Service     = bounded-context business/domain implementation
Worker role = async execution role of the owning service
Contracts   = cross-service typed protocol boundary
Edge Worker = explicit Cloudflare/serverless runtime, not generic backend worker
```

Business code belongs under `services/<service>/src/modules`. A service may expose API, NATS consumer, queue worker and scheduler roles from the same codebase. A separate top-level worker requires explicit architectural justification.

## Package plan structure

1. YAML frontmatter
2. package title
3. status / ADRs / references / dependencies / design effort
4. purpose
5. non-goals
6. manager pattern
7. subpath/file layout
8. contracts split
9. locked public API/export map
10. core architecture/execution
11. drivers/adapters/providers
12. configuration/validation
13. discovery/registry
14. runtime matrix
15. security
16. errors/recovery
17. observability
18. concurrency/performance/resource limits
19. tenancy/isolation where applicable
20. persistence/migration/compatibility where applicable
21. testing/conformance
22. dependencies/exports/versioning
23. implementation phases
24. exit criteria
25. cross-references

## Service plan structure

1. bounded-context ownership and invariants
2. explicit module tree under `src/modules`
3. internal application/domain/infrastructure boundaries
4. HTTP/control-plane API
5. NATS/event/queue contracts
6. persistence and migrations
7. internal interfaces and provider adapters
8. runtime-role bootstrap (`api`, `consumer`, `worker`, `scheduler` as required)
9. idempotency, retries, DLQ and reconciliation
10. authentication, authorization and tenant isolation
11. audit and operational observability
12. health/readiness and graceful shutdown
13. concurrency, resource limits and scaling
14. testing and contract conformance
15. container/deployment/rollback
16. implementation phases and exit criteria

## Cross-service contracts

`@stackra/contracts` owns externally consumed DTOs, schemas, commands, queries, events, errors, enums and public protocol interfaces.

Consumers MUST NOT import another service's implementation, ORM entity, repository, provider SDK or internal interface.

Internal service interfaces stay inside the owning service.

## NestJS standard

NestJS is the canonical Node.js service framework. Use its native modular dependency injection, microservice transports, NATS support, queue integrations, lifecycle hooks, validation, OpenAPI and hybrid application capabilities rather than inventing parallel mechanisms. NestJS supports NATS request/response, event-based handlers and queue groups; it also supports HTTP + microservice hybrid applications. citeturn0search1turn0search3turn2search7

Service plans must use:

- explicit bootstrap and runtime role;
- dependency injection and module boundaries;
- platform-standard Fastify adapter where applicable;
- global schema/runtime validation;
- versioned OpenAPI for HTTP;
- NATS/queue consumers for asynchronous workloads;
- bounded concurrency and backpressure;
- correlation/request/trace propagation;
- structured logging;
- OpenTelemetry instrumentation;
- role-appropriate health/readiness;
- graceful shutdown and connection draining;
- timeouts, cancellation, retry budgets and idempotency;
- service authentication and authorization;
- contract/integration/e2e/conformance tests;
- immutable production containers.

NestJS's production guidance explicitly covers health checks, logging, observability, scaling, Dockerization, security, backups, CI/CD and rate limiting. citeturn2search6

## Validation and API contracts

Use the repository's canonical schema policy. NestJS supports `ValidationPipe` and Standard Schema validation; choose one canonical Figentra approach and do not duplicate validation systems inside services. citeturn2search4

OpenAPI generation must remain synchronized with public HTTP DTOs/contracts. Nest's CLI plugin can derive OpenAPI metadata from DTOs and validation decorators, but runtime validation remains mandatory. citeturn2search0

## Worker rules

A worker role is justified by asynchronous execution needs, not by naming. It must:

- run the same service modules as the API where domain logic is shared;
- consume through NATS/JetStream or the selected queue abstraction;
- use durable acknowledgement semantics;
- be idempotent;
- bound concurrency and memory;
- implement retry/DLQ/reconciliation behavior;
- expose readiness/drain semantics;
- stop accepting new work before shutdown;
- finish or safely release in-flight work;
- emit correlated operational telemetry.

Do not create `workers/<service>` when a service worker role is sufficient.

## Cloudflare Worker rules

Cloudflare Workers are reserved for explicit edge/serverless workloads. Cloudflare provides a growing subset of Node.js APIs, with compatibility enabled by default for recent compatibility dates, but this remains a distinct runtime. citeturn0search0turn0search13

A plan must never assume that a normal NestJS Node process can be deployed unchanged as a Cloudflare Worker. If Cloudflare is selected, the plan must explicitly define the Worker entrypoint, supported APIs, state model, bindings, limits, deployment and integration boundary.

## DI, lifecycle and state

Every injectable component defines scope, token, construction, lifecycle and shutdown behavior. Request/execution context is explicit. No hidden global current-user/request state. Worker processes must tolerate restart and never rely on in-memory state for durable correctness.

## Discovery

Use one canonical mechanism:

```text
Discovery → locate metadata
Registry  → store/index
Populator → populate
Factory   → construct
Adapter   → translate
Provider  → DI construction
Manager   → orchestrate
```

## Configuration

Configuration is schema-validated before use. Secrets are never logged, embedded in client bundles, returned by diagnostics or persisted in plaintext application state. Unsafe production configuration fails closed unless a documented safe degraded mode exists.

## Errors and recovery

Plans define typed errors, error codes/envelopes, causes, retryability, cancellation, timeout semantics, safe serialization and transport mapping. Distributed operations define idempotency and recovery behavior.

## Observability

Logs, metrics and traces are mandatory where applicable. `@stackra/logger` owns structured logging; `@stackra/observability` owns OpenTelemetry traces, metrics, propagation and instrumentation. Monitoring infrastructure consumes these signals; it is not a duplicate application package.

Sensitive fields, credentials, tokens and PII are centrally redacted. High-cardinality identifiers must not become unbounded metric labels.

## Security

Plans cover authentication, authorization, tenant isolation, input validation, output safety, secret handling, SSRF/path traversal where relevant, replay/idempotency, rate limits, resource exhaustion, dependency failure and audit requirements.

## Testing

Required where applicable:

- unit tests
- integration tests with real adapters
- protocol/contract tests
- adapter conformance tests
- runtime-specific tests
- failure/recovery tests
- security tests
- concurrency/load tests
- dependency-boundary/public-export tests
- deployment/readiness/shutdown tests for services

## Performance

Document time complexity where meaningful, concurrency limits, buffer/queue limits, memory behavior, timeouts, retry budgets, payload limits, pagination limits and cleanup behavior.

## Migration

Every plan defines current-to-target migration, versioning, compatibility, data migration and rollback. Compatibility adapters require an explicit boundary and removal condition and cannot become the target architecture.

## Phase rule

Every phase lists implementation files/components, contracts touched, tests, observability, security implications, migration/compatibility implications and explicit completion criteria.

## Exit rule

A plan is ready only when ownership, source location, public contracts, dependencies, runtime roles, configuration, failure/recovery, security, observability, testing, deployment and migration are all explicit and no competing legacy architecture remains.
