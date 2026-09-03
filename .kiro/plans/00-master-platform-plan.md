---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
---

# Figentra — Enterprise Day-One Architecture & Implementation Plan

This is the cross-platform implementation contract. Detailed package/service plans live under their canonical directories; architecture decisions live in `.docs/adr`.

## Final ownership model

```text
Package      = reusable technical capability / SDK
Service      = bounded-context business implementation
Worker role  = asynchronous runtime role of its owning service
Application  = product UX/composition
Cloudflare   = explicit edge/control-plane runtime
```

## Canonical services — 14

```text
services/
├── identity
├── tenant
├── iam
├── monetization
├── usage
├── workflow
├── notifications
├── audit
├── files
├── integrations
├── search
├── reporting
├── analytics
└── marketing
```

### Consolidations

- Scope → removed; tenancy is Tenant context and resource hierarchy belongs to the owning product domain.
- Policy → IAM.
- Approval → Workflow human-task primitive.
- Entitlements → Monetization.

See `.docs/adr/ADR-0024-final-domain-boundaries.md`.

## Workflow architecture

Workflow is a service plus reusable `@stackra/workflow` SDK boundary.

```text
Business service
  ↓ workflow definition / typed SDK
Workflow service
  ↓ durable execution
PostgreSQL + NATS JetStream
  ↓
service commands/events
```

Business services own business state. Workflow owns execution state, timers, retries, compensation, human tasks and approvals. See `.docs/adr/ADR-0025-workflow-sdk-and-service.md`.

## Identity / authorization

Identity answers **who**. IAM answers **whether**. Monetization answers **whether the commercial capability is available**.

```text
Gateway
 → Identity authentication
 → RequestContext
 → IAM authorization
 → Monetization entitlement check where applicable
 → owning service
```

## Communication

- HTTPS + OpenAPI: default synchronous service contract.
- NATS + JetStream: canonical durable asynchronous transport.
- Transactional outbox: required for durable event publication.
- Redis: cache, rate limiting, short-lived coordination and locks.
- Kafka: ADR-only, never default.

## Signals

Logger owns logs; Observability owns OpenTelemetry; Tracking owns behavioral collection; Analytics owns analytical interpretation; Marketing owns activation; Audit owns immutable governance records; Usage owns metering; Notifications owns delivery.

## Infrastructure

Docker is the deterministic packaging boundary. Terraform is the infrastructure/state boundary. Development, staging and production are isolated. Monitoring is infrastructure/operations, not a business service.

## Canonical plan locations

- Global architecture/infrastructure: `.kiro/plans/01-global/`
- Package plans: `.kiro/plans/packages/`
- Service plans: `.kiro/plans/services/`
- Worker plans: `.kiro/plans/workers/`
- Application plans: `.kiro/plans/apps/`

Historical flat dated plans are migration sources only. They must not remain as competing implementation contracts after their useful content is merged into the canonical owner.

## Implementation gate

No implementation starts from an underspecified component. Every canonical spec/plan must define models, relations, DTOs, interfaces/methods, controllers, events/commands, persistence, authorization, service relationships, runtime roles, configuration, security, reliability, observability, testing, migration and deployment behavior.

Cross-service contracts are owned by `@stackra/contracts`; services never import another service's implementation or database models.
