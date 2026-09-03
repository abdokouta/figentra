# Figentra — Canonical Service Catalog

**Status:** Normative
**Count:** 14 deployable bounded-context services

A service exists only when it owns an independent business bounded context, state, lifecycle, security boundary and scaling/deployment boundary. Worker roles are not services.

## Canonical services

| # | Service | Owns |
|---|---|---|
| 01 | Identity | Authentication orchestration, principals, identities, credentials/references, sessions, provider links, service identities, delegation |
| 02 | Tenant | Tenants, platform organizations, domains, residency, application bindings, provisioning and tenant settings |
| 03 | IAM | Permissions, roles, assignments, authorization and policy definitions/evaluation |
| 04 | Monetization | Products/plans/prices, subscriptions, billing, invoices/payments, discounts/credits and entitlements |
| 05 | Usage | Usage facts, meters, aggregation, consumption periods, quotas and billable usage |
| 06 | Workflow | Definitions/versions, executions, steps, timers, signals, retries, compensation, human tasks, approvals and escalation |
| 07 | Notifications | Templates, preferences, channels, deliveries and provider attempts |
| 08 | Audit | Immutable audit records, attribution, retention, export, integrity and reconciliation |
| 09 | Files | File metadata, upload sessions, object references, versions, lifecycle and processing orchestration |
| 10 | Integrations | External connections, credential references, OAuth state, webhooks, mappings, sync/import/export and reconciliation |
| 11 | Search | Indexes, mappings, projections, indexing jobs, search contracts and reindexing |
| 12 | Reporting | Report definitions, parameters, execution, schedules, operational read models and exports |
| 13 | Analytics | Analytical ingestion, facts, dimensions, metrics, aggregation, attribution and analytical queries |
| 14 | Marketing | Audiences, segments, campaigns, journeys, eligibility, suppression, scheduling, activation and conversions |

## Removed standalone boundaries

| Former service | Owner | Decision |
|---|---|---|
| Scope | Tenant + IAM context | Remove. Tenant owns tenancy; product domains own resource hierarchies; IAM consumes resource context. |
| Policy | IAM | Remove. Authorization policy is part of IAM. |
| Approval | Workflow | Remove. Approval is a durable human-task/workflow primitive. IAM determines authorization/eligibility. |
| Entitlements | Monetization | Remove. Entitlements are the effective commercial access result of plans, subscriptions, grants, overrides and limits. |

## Core relationships

```text
Identity → authenticated principal
Tenant → tenant context
IAM → authorization/policy decision
Monetization → entitlement decision
Usage → consumption facts
Workflow → durable orchestration/approval execution
Audit ← security-sensitive mutations from all services
Analytics ← tracking/domain facts
Marketing ← analytics → Notifications
```

### Identity → IAM

Identity answers **who**. IAM answers **whether**.

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

No service calls Identity for permission decisions and no service owns a private role/permission database.

### Monetization → Usage

Usage measures consumption. Monetization owns commercial terms and effective entitlements and consumes Usage facts.

### Workflow → IAM

Workflow owns approval execution; IAM owns authorization. An approval step is not an authorization model.

### Audit

Audit belongs conceptually to governance/security/compliance, but remains a focused service. Do not create a generic Governance service. A future Compliance/Risk service may consume Audit if it becomes a genuine bounded context.

### Analytics → Marketing → Notifications

Analytics answers what happened; Marketing decides what action to take; Notifications delivers communication.

## Runtime and communication

Every service may expose `api`, `consumer`, `worker` and `scheduler` roles from one NestJS source tree. HTTP + OpenAPI is the default synchronous contract. NATS + JetStream is the canonical durable asynchronous transport. Durable events use transactional outbox. Redis is support infrastructure; Kafka requires an ADR.

Independent Cloudflare components remain Gateway, Registry and Infrastructure Orchestrator. They do not duplicate service implementations.

## Implementation gate

Each service spec must lock modules, models, relations, DTOs, interfaces/methods, controllers, events/commands, persistence, authorization, service dependencies, runtime roles, configuration, security, reliability, observability, tests, migrations and deployment. Missing design is a specification defect, not an implementation task.
