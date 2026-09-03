# Figentra Platform — Canonical Architecture Contract

**Status:** Normative / implementation locked

## 1. Ownership law

Figentra has one authoritative owner for every business domain. Services own bounded-context business state. Packages own reusable technical capabilities. Applications compose product experiences. Runtime workers execute service-owned asynchronous work.

No implementation may introduce a competing owner, identity model, authorization model, event bus, persistence boundary or duplicated business service.

## 2. Runtime planes

```text
EDGE
  Cloudflare DNS / WAF / Workers
        ↓
GATEWAY
  authentication context / routing / rate limits / correlation
        ↓
CONTROL PLANE — NestJS
  Identity Tenant IAM Monetization Usage Workflow
  Notifications Audit Files Integrations Search Reporting
  Analytics Marketing
        ↓
DATA / ASYNC PLANE
  PostgreSQL + Outbox + NATS JetStream + service-owned workers
```

## 3. Canonical services — 14

| Service | Owns |
|---|---|
| Identity | authentication orchestration, principals, identities, credentials/references, sessions, provider links, service identities, delegation |
| Tenant | tenants, platform organizations, domains, residency, application bindings, provisioning and tenant settings |
| IAM | permissions, roles, assignments, authorization and policy definitions/evaluation |
| Monetization | products/plans/prices, subscriptions, billing, invoices/payments, discounts/credits and entitlements |
| Usage | usage facts, meters, aggregation, consumption periods, quotas and billable usage |
| Workflow | definitions/versions, executions, steps, timers, signals, retries, compensation, human tasks, approvals and escalation |
| Notifications | templates, preferences, channels, deliveries and provider attempts |
| Audit | immutable audit records, attribution, retention, export, integrity and reconciliation |
| Files | file metadata, upload sessions, object references, versions, lifecycle and processing orchestration |
| Integrations | external connections, credential references, OAuth state, webhooks, mappings, sync/import/export and reconciliation |
| Search | indexes, mappings, projections, indexing jobs, search contracts and reindexing |
| Reporting | report definitions, parameters, execution, schedules, operational read models and exports |
| Analytics | analytical ingestion, facts, dimensions, metrics, aggregation, attribution and analytical queries |
| Marketing | audiences, segments, campaigns, journeys, eligibility, suppression, scheduling, activation and conversions |

## 4. Deliberately removed service boundaries

### Scope → removed

There is no generic platform Scope service. Tenant supplies tenancy context. Product services own their own resource hierarchies. IAM evaluates authorization against resource/context supplied by the owning domain.

### Policy → IAM

Policy definitions, versions and evaluation are part of authorization and therefore belong to IAM.

### Approval → Workflow

Approval is a durable human-task/workflow primitive. Workflow owns execution and decisions; IAM determines who is authorized/eligible.

### Entitlements → Monetization

Entitlements are the effective commercial access result of plans, subscriptions, grants, overrides and limits. Monetization owns them.

## 5. Identity and authorization

Identity answers **who is authenticated**. IAM answers **whether that principal may perform an action**.

```ts
const principal = await identity.resolveAuthenticatedPrincipal(token);
const decision = await iam.authorize({
  principalId: principal.id,
  tenantId: ctx.tenantId,
  resource: { type: resourceType, id: resourceId },
  action: 'resource.action',
  context,
});
```

Services MUST NOT call Identity for permission decisions and MUST NOT implement private role/permission stores. Identity MUST NOT own authorization policy.

## 6. Commercial authorization

Commercial capability checks are distinct from IAM authorization:

```text
IAM        → may this principal perform the action?
Monetization → does this tenant/account have the commercial capability?
```

A protected operation can require both decisions.

## 7. Workflow architecture

Workflow is a service **and** has a reusable SDK boundary. Business services define their business workflows using `@stackra/workflow` contracts/DSL; the Workflow service provides durable execution state and orchestration.

```text
Business Service
   ↓ @stackra/workflow definition
Workflow Service
   ↓
Durable execution / timers / retries / compensation
   ↓
NATS JetStream + service commands/events
```

Workflow MUST NOT own another service's business state. It orchestrates through versioned contracts. Approval is implemented as a workflow human-task primitive.

## 8. Standard request path

```text
Client
 → Gateway
 → Identity authentication/context
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

## 9. Cross-service communication

HTTPS + OpenAPI + typed SDK is the default synchronous contract. NATS request/reply is reserved for justified internal low-latency interactions. NATS + JetStream is the canonical durable asynchronous transport. Durable publication uses transactional outbox. Redis is cache/coordination infrastructure. Kafka requires an ADR.

## 10. Data ownership

No service writes another service's database. Cross-service references are opaque IDs. Foreign keys do not cross service database boundaries. Consumer read models never become accidental sources of truth.

## 11. Runtime worker model

A worker is normally a role of its owning NestJS service. API, consumer, worker and scheduler roles share the same domain modules. Workers implement bounded concurrency, cancellation, timeouts, idempotency, retries/DLQ where applicable, readiness and graceful shutdown.

Separate `workers/<service>` applications require an ADR proving a genuinely independent runtime/deployment boundary. Independent Cloudflare workers remain Gateway, Registry and Infrastructure Orchestrator only.

## 12. Audit and governance

Audit is a focused governance/security boundary. It owns immutable audit records, not logs, traces, analytics or domain events. A future Compliance/Risk service may consume Audit when it becomes an independent bounded context.

## 13. Signals

```text
Logger       → logs
Observability→ OpenTelemetry traces/metrics
Tracking     → behavioral collection SDK
Analytics    → analytical interpretation
Marketing    → campaign decisions/activation
Audit        → immutable governance records
Usage        → metering/billable consumption
Events       → domain facts
Notifications→ delivery
```

These are deliberately non-interchangeable.

## 14. Infrastructure

Docker provides deterministic service/runtime images. Terraform owns cloud/infrastructure resources and environment state. Development, staging and production are isolated. Monitoring is infrastructure/operations, not a business service.

## 15. Implementation gate

A component is implementation-ready only when its spec defines ownership, modules, models, relations, DTOs, interfaces/methods, controllers, events/commands, persistence, dependencies, authorization, service relationships, runtime roles, configuration, security, reliability, observability, tests, migrations and deployment behavior with no unresolved architectural design.
