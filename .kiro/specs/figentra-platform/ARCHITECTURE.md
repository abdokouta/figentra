# Figentra Platform — Canonical Architecture Contract

**Status:** Normative / implementation locked
**Scope:** All services, packages, workers, applications, infrastructure and cross-component communication.

## 1. Architecture law

Figentra has one authoritative owner for every domain. Services own bounded-context business state. Packages own reusable technical capabilities. Applications own product UX/business composition. Workers are runtime roles of an owning service unless an ADR proves an independent deployment boundary.

No implementation may introduce a competing owner, transport, identity model, authorization model, event bus, discovery mechanism or persistence boundary.

## 2. Runtime planes

```text
EDGE
  Cloudflare DNS/WAF/SSL/Workers/Hono
        ↓
GATEWAY
  authentication context / routing / rate limits / correlation
        ↓
CONTROL PLANE — NestJS
  Identity Tenant Scope IAM Policy Approval Monetization Entitlements
  Notifications Audit Integrations Files Reporting Search Workflow
  Usage Analytics Marketing
        ↓
DATA / ASYNC PLANE
  PostgreSQL + Outbox + NATS JetStream + service worker roles
        ↓
EXTERNAL PROVIDERS / APPLICATIONS
```

## 3. Canonical services

| # | Service | Owns | Primary runtime roles |
|---|---|---|---|
| 01 | Identity | identities, principals, credentials, sessions, provider links, delegation | API, NATS consumer, scheduler |
| 02 | Tenant | tenants, domains, residency, provisioning, application bindings | API, worker, scheduler |
| 03 | Scope | hierarchical scopes and memberships/context | API, NATS consumer |
| 04 | IAM | roles, permissions, assignments, authorization decisions | API, NATS consumer |
| 05 | Policy | policy definitions, versions, evaluation | API, consumer, worker |
| 06 | Approval | approval requests, steps, decisions, escalation | API, worker, scheduler |
| 07 | Monetization | plans, prices, subscriptions, invoices/payment state references | API, worker, scheduler |
| 08 | Entitlements | features, grants, limits, effective access | API, consumer, worker |
| 09 | Usage | usage records, meters, aggregation, quota inputs | API, ingestion worker, aggregation worker |
| 10 | Notifications | templates, channels, preferences, deliveries, provider attempts | API, delivery worker, scheduler |
| 11 | Audit | immutable audit records, exports, retention, integrity | API, ingestion worker, reconciliation |
| 12 | Files | file metadata, upload sessions, object references, lifecycle, processing | API, processing worker |
| 13 | Integrations | external connections, credentials references, webhooks, sync state | API, worker, scheduler |
| 14 | Reporting | report definitions, runs, read models, exports | API, worker, scheduler |
| 15 | Search | indexes, mappings, indexing jobs, search/query contracts | API, indexing worker |
| 16 | Workflow | definitions, versions, runs, steps, compensation | API, worker, scheduler |
| 17 | Analytics | analytical events, facts, dimensions, metrics, attribution, aggregates | API/query, ingestion worker, aggregation/backfill |
| 18 | Marketing | audiences, campaigns, journeys, activation, conversions | API, audience/campaign/journey/activation workers |

## 4. Package ownership

```text
@stackra/contracts       cross-service protocol contracts
@stackra/container       DI/container primitives
@stackra/support         generic support utilities
@stackra/errors          canonical error model
@stackra/config          configuration loading/validation
@stackra/logger          structured logging
@stackra/observability   OpenTelemetry
@stackra/storage         storage abstractions
@stackra/cache           cache abstractions
@stackra/database        database lifecycle/transactions
@stackra/orm             ORM behavior
@stackra/schema          validation/serialization schemas
@stackra/pagination      pagination contracts
@stackra/state-machine   state transition primitives
@stackra/pipeline        execution pipeline
@stackra/http            HTTP transport primitives
@stackra/nats             NATS/JetStream adapter
@stackra/realtime        realtime transport
@stackra/link             deep-link primitives
@stackra/identity         reusable authentication/identity SDK
@stackra/tracking         behavioral collection SDK
```

Business services are not converted into packages merely for code reuse.

## 5. Identity → IAM boundary

Identity answers **who is authenticated** and resolves the canonical principal. IAM answers **whether that principal may perform an action**.

```ts
const principal = await identity.resolveAuthenticatedPrincipal(token);
const decision = await iam.authorize({
  principalId: principal.id,
  tenantId: ctx.tenantId,
  scopeId: ctx.scopeId,
  action: 'resource.action',
  resource: { type: 'resource', id: resourceId },
  context,
});
```

Services MUST NOT call Identity for permission decisions. Identity MUST NOT own roles/permissions/policies. IAM MUST NOT duplicate authentication/provider state.

## 6. Standard request path

```text
Client
 → Gateway
 → Identity authentication/context
 → service authentication/context validation
 → RequestContext
 → schema validation
 → IAM authorization
 → Entitlements/feature checks where applicable
 → Command/Query
 → Use Case
 → Domain
 → Repository/transaction
 → Outbox
 → commit
 → response
 → JetStream/worker processing
```

Gateway authorization is never the only authorization layer.

## 7. Cross-service communication

### Synchronous

Default: HTTPS + OpenAPI + typed SDK. Use NATS request/reply only for explicitly low-latency internal control-plane interactions where the service contract benefits from messaging semantics.

### Asynchronous

**NATS + JetStream is the canonical durable service-to-service messaging platform.**

All durable domain/integration events use the transactional outbox before publication.

### Redis

Redis is infrastructure support for cache, short-lived state, locks, rate limiting and acceleration. Redis Pub/Sub is not a durable business event bus.

### Kafka

Kafka is not a default Figentra dependency. It may be introduced only through an ADR for a measured high-volume streaming/data-platform requirement that JetStream cannot satisfy.

## 8. Event lifecycle

```text
transaction
 ├─ domain state
 └─ outbox record
       ↓
relay
       ↓
NATS JetStream
       ↓
consumer
       ↓
ack/retry or ack
       ↓
DLQ/reconciliation when terminal
```

Event envelopes carry immutable event ID, event type/version, occurrence time, producer, tenant where applicable, principal where safe, correlation ID and causation ID.

## 9. Data ownership

No service directly writes another service database. Cross-service references are opaque IDs. Foreign keys never cross service database boundaries.

Read models/projections are explicitly owned by their consumer and never become accidental sources of truth.

## 10. Worker model

A worker is a runtime role of the owning NestJS service. It shares domain modules and contracts. Every worker has bounded concurrency, cancellation, timeout, idempotency, retry policy, DLQ/reconciliation semantics where applicable, readiness and graceful shutdown.

A separate `workers/<service>` implementation is forbidden unless an ADR establishes an independent runtime/deployment boundary.

## 11. Security

- Human authentication: Supabase Auth behind Identity.
- Service authentication: scoped short-lived service credentials.
- Authorization: IAM/Policy.
- Commercial access: Entitlements/Monetization.
- Tenant isolation: enforced by service context and persistence policies.
- Secrets: external secret management; never ordinary logs/telemetry.
- Sensitive mutations: Audit.

## 12. Observability boundary

Logger owns logs. Observability owns OpenTelemetry traces/metrics/propagation/instrumentation. Audit owns immutable audit records. Tracking owns behavioral collection. Analytics owns analytical interpretation. These are not interchangeable.

## 13. Infrastructure

Docker provides reproducible service/collector images. Terraform owns cloud/infrastructure resources and environment state. Development, staging and production are isolated. Monitoring infrastructure is operational consumption of telemetry, not a service/package domain.

## 14. Review gate

A component is implementation-ready only when its component spec defines ownership, public contracts, models, DTOs, methods, controllers, events, persistence, dependencies, authorization, service relationships, worker roles, configuration, security, reliability, observability, tests, migrations and deployment behavior with no unresolved architectural TODO.
