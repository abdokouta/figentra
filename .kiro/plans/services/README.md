# Service Plans

Services are the sole owners of business/domain implementations in Figentra. Implementation lives under `services/<service>/src/modules` and follows `.kiro/specs/figentra-platform/services/*`.

## Canonical services

1. Identity
2. Tenant
3. IAM
4. Monetization
5. Usage
6. Workflow
7. Notifications
8. Audit
9. Files
10. Integrations
11. Search
12. Reporting
13. Analytics
14. Marketing

Retired standalone boundaries: Scope → Tenant/IAM context; Policy → IAM; Approval → Workflow; Entitlements → Monetization.

## Canonical service-document structure

Every service uses the same production documentation contract:

```text
.kiro/plans/services/<service>/
├── README.md
├── 01-architecture.md
├── 02-implementation.md
├── 03-api.md
├── 04-data-model.md
├── 05-events.md
├── 06-jobs-and-scheduling.md
├── 07-security-and-authorization.md
├── 08-observability.md
├── 09-testing.md
└── 10-deployment-and-operations.md
```

`01-architecture.md` defines ownership, boundaries, domain responsibilities, dependencies, trust model, runtime topology, cross-service relationships, non-goals and architecture acceptance.

`02-implementation.md` is the complete day-one build contract: exact source tree, modules, entities, invariants, commands, queries, application methods, repository ports/adapters, controllers/routes/DTOs, authz, events, NATS subjects/streams, consumers, jobs, retry/DLQ/timeout behavior, schedulers, notification contracts, persistence, migrations, tenancy, security, health, observability, tests, deployment, rollback and operational runbooks.

`03-api.md` is the externally and internally exposed synchronous contract: routes, DTOs, validation, errors, authentication, authorization, idempotency, pagination, rate limits and versioning.

`04-data-model.md` is the authoritative persistence contract: entities/tables, columns, constraints, indexes, relationships, transaction boundaries, retention, encryption/classification and migration rules.

`05-events.md` is the asynchronous contract: event schemas, NATS streams/subjects, producers/consumers, outbox, idempotency, ordering, retries, DLQ and schema evolution.

`06-jobs-and-scheduling.md` defines every background job, worker, schedule, payload, timeout, retry/backoff, lease, checkpoint, idempotency, concurrency and recovery behavior. If a service has no autonomous job, the file must explicitly state that fact rather than inventing work.

`07-security-and-authorization.md` defines the service security boundary, Identity/IAM/Tenant integration, data protection, abuse controls, threat cases and fail-closed behavior without creating a private authorization engine.

`08-observability.md` defines structured logs, metrics, OTel spans, SLOs, alerts and audit hooks. Monitoring infrastructure remains the owner of collection and dashboards.

`09-testing.md` defines unit, integration, contract, security, E2E, reliability, load and migration/recovery verification.

`10-deployment-and-operations.md` defines runtime roles, configuration, Docker/Terraform integration, startup/readiness, scaling, rollout, rollback, recovery and operational runbooks.

## Current completed plan sets

| Service | Architecture | Implementation | Full operational set |
|---|---|---|---|
| Identity | complete | complete | complete |
| IAM | complete | complete | complete |
| Tenant | complete | complete | complete |
| Audit | complete | complete | complete |
| Integrations | complete | complete | complete |
| Monetization | pending | pending | pending |
| Usage | pending | pending | pending |
| Workflow | pending | pending | pending |
| Notifications | pending | pending | pending |
| Files | pending | pending | pending |
| Search | pending | pending | pending |
| Reporting | pending | pending | pending |
| Analytics | pending | pending | pending |
| Marketing | pending | pending | pending |

## Runtime

Each service may expose `api`, `consumer`, `worker` and `scheduler` roles from the same NestJS source tree. A mirrored `workers/<service>` implementation is forbidden unless an ADR proves an independent deployment boundary.

## Required per-module implementation detail

Every service plan must enumerate, for every module, exact source files and:

```text
entities/value objects/invariants
commands + application methods
queries + read methods
repository ports + adapters
controllers + routes + DTOs + authz
emitted/consumed event schemas
queue subjects/streams
jobs + handlers + payload + retry/DLQ/timeout
scheduler entries + occurrence/idempotency policy
notification/email/Slack request contracts
persistence tables + indexes + migrations
tenancy/IAM rules
audit hooks
health/readiness impact
metrics/traces/logging
unit/integration/contract/security/E2E/load tests
deployment/runtime configuration
```

The complete canonical matrix is `.kiro/plans/2026-09-03-service-implementation-contract.md`.

## Identity/IAM boundary

Identity answers **who is authenticated**. IAM answers **what that principal may do**. Identity's production provider is Supabase Auth. The provider abstraction is intentionally narrow and lives inside Identity; authentication adapters are not moved into the generic Integrations service. Clerk is not a day-one dependency and Clerk Organizations/Roles/Permissions are not part of Figentra authorization.

IAM owns roles, permissions, policies, grants, resource scopes, authorization evaluation, and authorization decision hooks. It never imports Identity persistence or provider SDKs.

## Contracts

Cross-service DTOs, commands, queries, events and errors are versioned in `@stackra/contracts`. Consumers never import another service's implementation, ORM entities, repositories or providers.

## Workflow

`@stackra/workflow` is the reusable workflow definition/execution-client SDK. The Workflow service owns durable execution, timers, retries, compensation, human tasks and approvals. Business services define workflows with the SDK and expose the business commands/events they execute.

## Authorization

Identity answers who is authenticated. Tenant owns tenancy. IAM answers whether the principal may act. Policy is part of IAM. Monetization provides commercial entitlement decisions. Services do not implement private authorization systems.

## Notifications

Business services never call SMTP, SES, SendGrid, Slack, SMS or push provider SDKs directly. They emit domain facts or explicit notification requests. Notifications owns provider delivery, retries, suppression and delivery state.

## Package integrations

Search, Reporting, Dashboard, SEO, Scope, SDUI and Page Builder are package/service integrations, not new microservices unless an ADR changes the boundary.

## Completion gate

No service plan is complete until every module is implementation-specified at file/method/controller/event/queue/job/scheduler/persistence/security/observability/test level, with no unresolved architecture. The ten-document service set is the canonical planning surface; implementation must not invent undocumented boundaries.