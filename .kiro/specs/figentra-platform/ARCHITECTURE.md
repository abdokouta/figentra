# Figentra Platform — Canonical Architecture Contract

**Status:** Normative / implementation locked

## 1. Ownership law

Figentra has one authoritative owner for every business domain. Services own bounded-context business state. Packages own reusable technical capabilities. Applications compose product experiences. Service worker roles execute asynchronous work from the owning NestJS source tree.

No implementation may introduce a competing owner, identity model, authorization model, persistence boundary or duplicated business service.

## 2. Runtime planes

```text
EDGE
  Cloudflare DNS/WAF
       ↓
  Gateway — Cloudflare Worker + Hono
       ↓
CONTROL PLANE
  14 NestJS services
       ↓
DATA / ASYNC PLANE
  PostgreSQL + transactional outbox + NATS JetStream
       ↓
  service-owned consumer/worker/scheduler roles
```

Independent Cloudflare control-plane Workers:

```text
Gateway
Application Registry
Infrastructure Orchestrator
```

These are independent Worker applications, not business services and not replacements for service workers.

## 3. Canonical services — 14

| Service | Owns |
|---|---|
| Identity | authentication orchestration, identities, principals, credentials/references, sessions, provider links, service identities and delegation |
| Tenant | tenants, organizations, domains, residency, application bindings, provisioning and tenant settings |
| IAM | permissions, roles, assignments, authorization and policy definitions/evaluation |
| Monetization | plans/prices, subscriptions, billing, invoices/payments, discounts/credits and entitlements |
| Usage | usage facts, meters, aggregation, consumption periods, quotas and billable usage |
| Workflow | workflow definitions/versions, executions, steps, timers, signals, retries, compensation, human tasks, approvals and escalation |
| Notifications | templates, preferences, channels, deliveries and provider attempts |
| Audit | immutable audit records, attribution, retention, export, integrity and reconciliation |
| Files | file metadata, upload sessions, object references, versions, lifecycle and processing orchestration |
| Integrations | external connections, credential references, OAuth state, webhooks, mappings, sync/import/export and reconciliation |
| Search | indexes, mappings, projections, indexing jobs, search contracts and reindexing |
| Reporting | report definitions, parameters, executions, schedules, operational read models and exports |
| Analytics | analytical ingestion, facts, dimensions, metrics, aggregation, attribution and analytical queries |
| Marketing | audiences, segments, campaigns, journeys, eligibility, suppression, scheduling, activation and conversions |

## 4. Removed standalone boundaries

- **Scope → removed:** tenant is the tenancy context; product services own resource hierarchies; IAM consumes resource/context.
- **Policy → IAM:** authorization policy is part of IAM.
- **Approval → Workflow:** approval is a durable human-task/workflow primitive; IAM determines authorization/eligibility.
- **Entitlements → Monetization:** effective commercial access belongs to Monetization.

## 5. Identity and authorization

Identity answers **who is authenticated**. IAM answers **whether the principal may act**. Monetization answers **whether the commercial capability is available**. Applications enforce domain/business rules.

```text
Authentication → Identity → Principal
Authorization  → IAM
Commercial     → Monetization
Business rules → owning service/application
```

Supabase Auth is the day-one human authentication provider. `@stackra/identity` is the provider/identity boundary; services do not implement their own identity or authorization stores.

## 6. Standard request path

```text
Client
 → Gateway
 → authentication/context
 → RequestContext
 → schema validation
 → IAM authorization
 → Monetization entitlement check when applicable
 → command/query
 → domain
 → repository/transaction
 → outbox
 → commit
 → response
```

Gateway authorization is never the only authorization layer.

## 7. Cross-service communication

- Browser/client → Gateway: HTTPS.
- Gateway → Worker: Cloudflare Service Binding where compatible.
- Gateway → NestJS service: authenticated HTTPS.
- Service sync calls: HTTPS + OpenAPI + typed SDK.
- Durable async: NATS + JetStream + transactional outbox.
- Redis: cache/coordination.
- Kafka: ADR-only.

No universal NestJS RPC contract.

## 8. Data ownership

No service writes another service database. Cross-service IDs are opaque. Foreign keys do not cross service database boundaries. Consumer projections never become accidental sources of truth.

## 9. Workflow

`@stackra/workflow` provides reusable workflow definition/execution-client contracts. The Workflow service owns durable orchestration. Business services define workflows and own business state; Workflow never writes business data directly.

## 10. Package decomposition law

```text
Capability           → package
Provider / driver    → package subpath
Runtime integration  → package subpath
Framework adapter    → package subpath
Testing integration  → package subpath
```

Standalone runtime foundations (`node`, `browser`, `react`, `react-native`, `desktop`, `worker`, `nestjs`) are retained only for shared runtime/foundation responsibilities. Feature-specific adapters belong to their owning capability package.

## 11. Worker architecture

### Gateway
Cloudflare Worker + Hono. Owns public edge routing, request normalization, authentication prevalidation, rate limits, correlation/trace context and upstream dispatch.

### Application Registry
Cloudflare Worker + Hono. D1 is authoritative for sanitized application metadata; KV is disposable cache/optimization. Applications own source manifests. Registry never owns application business data and never executes application code.

### Infrastructure Orchestrator
Cloudflare Worker + Hono. Owns authenticated infrastructure control intents and reconciliation. Terraform remains authoritative for durable infrastructure resources.

### Service workers
Every ordinary service uses the same NestJS source tree for `api`, `consumer`, `worker` and `scheduler` roles. Independent `workers/<service>` applications require an ADR.

## 12. Signal ownership

```text
Logger        → structured logs
Observability → OpenTelemetry traces/metrics/propagation
Tracking      → behavioral collection SDK
Analytics     → analytical facts/aggregation/attribution
Marketing     → campaign decisions and activation
Audit         → immutable accountability records
Usage         → metering/billable consumption
Events        → business facts
Notifications → delivery
```

## 13. Infrastructure and environments

Docker is the standard container boundary for NestJS services/roles. Terraform is infrastructure source of truth. Environments are exactly `development`, `staging`, `production` and are isolated.

## 14. Implementation gate

A component is implementation-ready only when its specification defines ownership, exact source layout, public contracts, dependencies, lifecycle/DI, configuration, security, failure/recovery, observability, concurrency/resource limits, tenancy/isolation, persistence/migration where applicable, testing and deployment. Missing architecture is a specification defect, not an implementation task.
