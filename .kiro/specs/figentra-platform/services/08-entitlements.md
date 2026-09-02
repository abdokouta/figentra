# Entitlements Service — Kiro Implementation Specification

**Spec:** `figentra-platform/services/entitlements.md`  
**Package:** `@figentra/entitlements`  
**Status:** Baseline target / implementation specification  
**Runtime:** Node.js 22 + NestJS in Cloudflare Containers  

## 1. Mission and boundary

**Purpose:** Effective commercial capabilities, quotas, limits and overrides.

This service is the sole authoritative owner of its bounded context. It may expose read APIs and publish events, but it MUST NOT write another service's database or reuse another service's ORM entities.

### Owns

- Entitlement Definition
- Tenant Entitlement
- Entitlement Override
- Quota Definition
- Quota Usage Snapshot

### May call / consume

- `@figentra/tenant-client` or the corresponding typed SDK contract for **tenant**.
- `@figentra/monetization-client` or the corresponding typed SDK contract for **monetization**.
- `@figentra/iam-client` or the corresponding typed SDK contract for **iam**.
- `@figentra/usage-client` or the corresponding typed SDK contract for **usage**.
- `@figentra/audit-client` or the corresponding typed SDK contract for **audit**.

### Must not own

- Authentication provider state owned by Supabase Auth.
- Authorization policy owned by IAM/Policy.
- Commercial entitlement decisions owned by Monetization/Entitlements.
- Business data belonging to product applications.

## 2. Runtime and dependencies

- Node.js 22 + TypeScript strict
- NestJS for HTTP/application runtime
- MikroORM for persistence
- `@figentra/contracts` for API DTO/schema contracts
- `@figentra/events` for event contracts
- `@figentra/messaging` for transport adapters
- `@figentra/security` for authentication/service trust primitives
- `@figentra/observability` for OpenTelemetry/logging
- `@figentra/outbox` when the component publishes durable events
- Supabase PostgreSQL for transactional state
- NATS JetStream for durable service-to-service asynchronous messaging
- Cloudflare Queues for Cloudflare-native worker/background workloads


### Dependency policy

- Runtime dependencies contain only packages required at runtime.
- Test/build/lint/format packages remain dev dependencies unless imported by runtime code.
- Peer dependencies are used only where consumers supply the framework/runtime.
- Optional dependencies are reserved for provider adapters; core startup MUST NOT fail because an optional provider is absent.
- No dependency may create a circular bounded-context dependency.


## Package manifest (repository baseline)

> This section is generated from the current repository `package.json`. The Kiro spec is the target contract; if implementation changes dependencies, update the spec and package manifest together.

### Runtime dependencies
- `@figentra/contracts`
- `@figentra/events`
- `@figentra/messaging`
- `@figentra/observability`
- `@figentra/security`
- `@nats-io/transport-node`
- `@nestjs/common`
- `@nestjs/config`
- `@nestjs/core`
- `@nestjs/microservices`
- `@nestjs/platform-fastify`
- `@nestjs/terminus`
- `class-transformer`
- `class-validator`
- `fastify`
- `nestjs-i18n`
- `nestjs-pino`
- `pino`
- `pino-http`
- `reflect-metadata`
- `rxjs`

### Development dependencies
- `@nestjs/cli`
- `@nestjs/schematics`
- `@nestjs/testing`
- `@stackra/oxlint-config`
- `@stackra/prettier-config`
- `@stackra/typescript-config`
- `@swc/cli`
- `@swc/core`
- `@types/node`
- `@types/supertest`
- `@vitest/coverage-v8`
- `oxlint`
- `prettier`
- `prettier-plugin-tailwindcss`
- `source-map-support`
- `supertest`
- `typescript`
- `unplugin-swc`
- `vite-tsconfig-paths`
- `vitest`

### Peer dependencies
- _None currently._

### Optional dependencies
- _None currently._

## 3. Source layout

```text
src/
├── entitlements/
│   ├── application/        # use cases, commands, queries, DTO orchestration
│   ├── domain/              # entities, value objects, domain rules
│   ├── infrastructure/      # MikroORM, transport, providers, config
│   ├── presentation/        # controllers, OpenAPI, response mapping
│   ├── events/              # owned event definitions and handlers
│   └── entitlements.module.ts
├── database/
│   ├── migrations/
│   └── seeds/
├── i18n/en/
├── i18n/ar/
├── app.module.ts
└── main.ts
```

## 4. Domain model

### Core entities

- **`entitlement_definition`** — aggregate/domain record. Define lifecycle, invariants, state transitions, actor attribution, tenant ownership and soft-delete policy before implementation.
- **`tenant_entitlement`** — aggregate/domain record. Define lifecycle, invariants, state transitions, actor attribution, tenant ownership and soft-delete policy before implementation.
- **`entitlement_override`** — aggregate/domain record. Define lifecycle, invariants, state transitions, actor attribution, tenant ownership and soft-delete policy before implementation.
- **`quota_definition`** — aggregate/domain record. Define lifecycle, invariants, state transitions, actor attribution, tenant ownership and soft-delete policy before implementation.
- **`quota_usage_snapshot`** — aggregate/domain record. Define lifecycle, invariants, state transitions, actor attribution, tenant ownership and soft-delete policy before implementation.

### Relationships

- Every tenant-owned entity carries `tenant_id` unless explicitly proven global.
- Foreign keys are internal to this service database. Cross-service references are opaque IDs and are validated through contracts, never foreign keys into another service.
- Actor attribution uses `principal_id`; do not duplicate user/profile records.
- Scope-aware records carry `scope_id` when access is subordinate to a scope.

## 5. Target database schema

The following is the **target implementation schema**, not a claim that every table already exists. Exact columns are finalized in the service migration plan and entity definitions.

| Table | Primary key | Tenant | Required metadata | Notes |
|---|---|---|---|---|
| `entitlement_definition` | `entitlement_definition_id` (ULID/domain prefix) | tenant_id where tenant-owned | created_at, updated_at | owning aggregate fields; unique/indexes as required |
| `tenant_entitlement` | `tenant_entitlement_id` (ULID/domain prefix) | tenant_id where tenant-owned | created_at, updated_at | owning aggregate fields; unique/indexes as required |
| `entitlement_override` | `entitlement_override_id` (ULID/domain prefix) | tenant_id where tenant-owned | created_at, updated_at | owning aggregate fields; unique/indexes as required |
| `quota_definition` | `quota_definition_id` (ULID/domain prefix) | tenant_id where tenant-owned | created_at, updated_at | owning aggregate fields; unique/indexes as required |
| `quota_usage_snapshot` | `quota_usage_snapshot_id` (ULID/domain prefix) | tenant_id where tenant-owned | created_at, updated_at | owning aggregate fields; unique/indexes as required |

### Universal columns

Use where applicable:

```text
id
tenant_id
created_at
updated_at
created_by
updated_by
version
deleted_at (only where soft deletion is required)
metadata (JSONB only for bounded extensibility, not core relational data)
```

### Constraints

- Primary keys use the repository ID strategy.
- Unique constraints include tenant scope when the business identifier is tenant-local.
- State transitions use check constraints/enums where stable; domain code remains authoritative for transition rules.
- Foreign keys are indexed.
- Query patterns determine composite indexes.
- Never add an index without a query/use-case reason or migration comment.

## 6. MikroORM policy

### Repository first

Use injected repositories for normal CRUD and aggregate persistence:

```ts
constructor(private readonly repository: EntityRepository<Entity>) {}
```

Repositories own query construction for the aggregate. Keep query methods intention-revealing (`findByTenant`, `findActive`, `findByExternalId`) instead of leaking controllers into persistence.

### EntityManager

Use `EntityManager` when:

- a use case must atomically persist multiple aggregates/entities in this service;
- an explicit transaction boundary is required;
- bulk persistence or flush coordination is required;
- infrastructure code must coordinate Unit of Work behavior.

Do **not** inject `EntityManager` into every service just because MikroORM provides it. Do not use it to bypass repository/domain boundaries.

### Transactions

```text
Controller
  → UseCase
    → domain mutations
      → repositories / EntityManager transaction
        → outbox append
          → commit
```

No event is published directly from a controller after `flush()`.

## 7. Request pipeline and middleware

### Gateway handles

- TLS/WAF/edge rate limiting.
- Host/domain resolution.
- Basic token prevalidation.
- Correlation/request ID propagation.
- Coarse request-size/protocol protections.

### Service handles

The service MUST remain secure when called directly by an authenticated internal client:

- JWT/service credential verification.
- Principal/service identity extraction.
- Tenant context verification.
- Scope context validation.
- IAM authorization.
- Input validation pipes.
- Idempotency handling for mutating APIs.
- Audit hooks for security-sensitive operations.
- OpenTelemetry context extraction.

Never rely on the gateway alone for authorization.

## 8. HTTP/OpenAPI surface

### Endpoints

- `GET /v1/entitlements`
- `POST /v1/entitlements/check`
- `POST /v1/entitlements/:key/override`
- `GET /v1/quotas`

Every controller MUST provide:

- request/response DTO schemas;
- operation summary and detailed description;
- authentication/security requirements;
- parameter and pagination documentation;
- response codes and error examples;
- idempotency requirements where applicable;
- correlation/request headers;
- examples for important workflows.

Generate/serve OpenAPI from the NestJS controllers and keep contract definitions synchronized with `@figentra/contracts`.

## 9. Commands, queries and application services

Separate intent from transport:

```text
Controller
  → Command/Query
    → UseCase
      → Domain
        → Repository
```

CRUD is allowed only when the domain operation is truly CRUD. Business actions must have named commands (`ApproveRequest`, `PauseIntegration`, `VerifyDomain`, etc.).

## 10. Events and messaging

### Owned events

- `entitlement.granted.v1` — emitted only after the owning transaction commits through the outbox.
- `entitlement.revoked.v1` — emitted only after the owning transaction commits through the outbox.
- `entitlement.override.created.v1` — emitted only after the owning transaction commits through the outbox.
- `quota.exceeded.v1` — emitted only after the owning transaction commits through the outbox.

### Event rules

- Event names are versioned and immutable.
- Envelope contains event ID, type, version, occurred-at, producer, tenant, principal, correlation ID and causation ID.
- Payload contains domain facts, not secrets or mutable implementation details.
- Consumers are idempotent.
- Publishing is via transactional outbox.
- NATS JetStream is the initial durable service-to-service event transport.
- Cloudflare Queues is used for worker-native asynchronous work and edge buffering.
- Kafka is a future scale-driven option only after an ADR.
- Redis Pub/Sub is never the authoritative durable event bus.
- gRPC is not a default transport; introduce it only for a measured low-latency RPC requirement with an ADR.

### Commands

Commands may be synchronous HTTP operations or internal asynchronous messages. A command names an intention and is not treated as an event.

## 11. Service-to-service communication

| Need | Mechanism | Rule |
|---|---|---|
| Immediate read/decision | HTTPS + OpenAPI + typed SDK | timeout + bounded retry |
| Worker-to-worker | Cloudflare Service Binding | no public endpoint required |
| Service-to-service async | NATS JetStream | durable stream + consumer + DLQ |
| Worker-native async | Cloudflare Queue | idempotent consumer + DLQ |
| Durable multi-step process | Cloudflare Workflow | explicit compensation/retry |
| Cache/lock | Redis | never authoritative |

Each service-to-service call authenticates the **calling service identity**, with delegated end-user context carried separately when required. Never reuse a browser token as a service credential.

## 12. Authorization

Effective authorization is evaluated from:

```text
Principal
+ Tenant
+ Scope
+ Resource
+ Action
+ Policy Context
        ↓
IAM / Policy
        ↓
ALLOW / DENY
```

Then commercial access may additionally require:

```text
Entitlement
+ Feature Flag
```

The service MUST enforce authorization server-side on every protected operation.

## 13. Filtering, scopes, sorting and pagination

All list APIs support the common contract where applicable:

- tenant context is implicit/trusted, not accepted as an arbitrary browser filter;
- scope filters are authorization-aware;
- validated field allowlists for filtering/sorting;
- cursor pagination for high-volume collections;
- explicit maximum page size;
- deterministic ordering;
- no raw SQL/order/filter fragments from clients.

Repository methods MUST apply tenant and authorization scope consistently.

## 14. Caching

Caching is layered:

```text
Browser/Stackra Query → Gateway cache (only safe public/runtime data)
                     → Service cache (domain reads)
                     → PostgreSQL source of truth
```

Rules:

- Cache stable/read-heavy metadata close to the service.
- Do not cache authorization decisions longer than their invalidation model allows.
- Do not cache secrets or sensitive identity material in shared caches.
- Keys include tenant/application/scope and relevant version.
- Writes invalidate or version affected keys.
- Cache misses must remain correct.
- Gateway must not cache tenant-specific mutable business responses unless explicitly designed and safely keyed.

## 15. Idempotency and concurrency

Mutating external/API operations that can be retried MUST support idempotency keys.

Use optimistic concurrency/version columns for update races where required. State-changing commands MUST reject illegal state transitions.

## 16. i18n/localization

The service keeps domain/user-facing messages under:

```text
src/i18n/en/
src/i18n/ar/
```

- Validation and business error messages are translated by stable keys.
- Domain entities do not embed localized text.
- API error codes remain language-neutral.
- Locale comes from trusted request/user/tenant preference, with a deterministic fallback.

## 17. Security

- Supabase Auth validates human authentication.
- Service identities use scoped credentials.
- Authorization is server-side.
- RLS is defense in depth.
- Secrets are injected from secret management.
- Sensitive values are redacted in logs.
- Webhooks are signature-verified and idempotent.
- Security-sensitive mutations create audit records.
- All internal endpoints require authenticated service identity.

## 18. Observability

Every request/job/event records or propagates:

```text
request_id
correlation_id
causation_id
trace_id
service
version
environment
tenant_id (where safe)
principal_id (where safe)
```

Required signals:

- structured logs;
- RED metrics for HTTP;
- queue/consumer metrics;
- DB latency/error metrics;
- OpenTelemetry traces;
- domain/business metrics where useful.

## 19. Database migrations

Migrations MUST be forward-only, deterministic and safe to run in CI/CD.

For each migration document:

1. tables/columns added;
2. constraints/indexes;
3. backfill requirements;
4. locking/downtime risk;
5. rollback strategy where technically possible;
6. data compatibility with previous application version.

Seeders are separate from migrations. Never hide required production data creation inside a migration unless it is immutable reference data.

## 20. Seed strategy

Provide deterministic seed layers:

```text
reference seed → development seed → test fixtures
```

Production seeds are explicit, reviewed and idempotent. No random values for identifiers that tests or integrations must depend on.

## 21. Testing matrix

### Unit

- domain invariants;
- state transitions;
- authorization decisions;
- filters/sort builders;
- DTO validation;
- cache-key construction;
- event mapping.

### Integration

- MikroORM repositories against PostgreSQL;
- migrations from empty DB;
- RLS policies where applicable;
- transaction + outbox atomicity;
- queue publishing/consuming;
- provider adapters.

### Contract

- OpenAPI request/response compatibility;
- event schema compatibility;
- SDK contract tests.

### E2E

- authenticated human flow;
- service-to-service flow;
- tenant isolation;
- denied permission;
- denied entitlement;
- retry/idempotency;
- failure/DLQ.

### Security

- forged tenant/scope IDs;
- cross-tenant reads/writes;
- token audience/issuer validation;
- service credential scope;
- injection and mass-assignment;
- sensitive-log leakage.

## 22. Documentation and code comments

Public classes, controllers, DTOs, repository methods, events and configuration must have useful JSDoc/comments. Comments explain **why**, invariants and security implications—not obvious syntax.

Every non-obvious query, cache invalidation rule, transaction boundary and event emission must be documented close to the code.

## 23. Operational runbook

Document:

- startup/readiness behavior;
- migration commands;
- seed commands;
- queue/DLQ replay;
- cache invalidation;
- credential rotation;
- incident diagnostics;
- data repair procedure;
- backup/restore expectations.

## 24. Acceptance criteria

The service is complete only when:

- ownership and boundary tests exist;
- migrations and seeds run from zero;
- OpenAPI is complete;
- all protected endpoints enforce auth + authorization;
- events are outbox-backed and versioned;
- consumers are idempotent;
- cache behavior is tested;
- tenant isolation is tested;
- observability is instrumented;
- docs/comments are present;
- CI passes lint/typecheck/unit/integration/contract/E2E/security gates.

## 25. Non-goals

- No direct cross-service database queries.
- No generic utility logic that belongs in a shared package.
- No business logic in the gateway.
- No authentication provider reimplementation.
- No service split merely because a table or noun exists.

## 26. Open questions

Any unresolved provider, scale, residency or product decision MUST be recorded as an ADR and linked from this spec.
