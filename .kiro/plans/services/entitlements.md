---
status: canonical
component: service
name: entitlements
---
# Entitlements Service — implementation plan

Own the authoritative mapping of tenant/account subscriptions and purchased capabilities to effective feature/limit entitlements.

## Modules
`catalog`, `entitlement`, `assignment`, `override`, `evaluation`, `expiry`, `persistence`, `http`, `messaging`.

## Runtime
NestJS `api` for entitlement reads/administration; `consumer` for monetization lifecycle events; `worker` for expiry/recalculation and reconciliation.

## Contracts
Versioned entitlement query/command/event contracts in `@stackra/contracts`. Evaluation is deterministic and side-effect free; authorization remains Policy/IAM.

## Persistence/reliability
Dedicated DB; effective-dated records; optimistic versions; unique tenant/subject/feature keys; transactional outbox; idempotent event handling; retry/DLQ and periodic reconciliation.

## Security / tenancy
Tenant and scope context required. Deny-by-default on missing context. No cross-tenant reads. Administrative overrides require audited actor context.

## Observability/testing
Trace evaluation and recalculation, measure cache/evaluation latency and drift. Test precedence, expiry, concurrency, contract compatibility, isolation and migrations.

## Deployment
Immutable Docker; independently scalable API/worker roles; Terraform resources; readiness, graceful shutdown and rollback-safe migrations.

## Exit criteria
Complete deterministic entitlement model, APIs, events, persistence, recalculation and production failure handling with no stubs.
