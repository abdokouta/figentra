---
status: canonical
component: service
name: monetization
---
# Monetization Service — implementation plan

Own plans, subscriptions, pricing, billing periods, invoices, payment intents and provider reconciliation. Entitlements are consumed, not owned, by this service.

## Modules
`plans`, `prices`, `subscriptions`, `billing-periods`, `invoices`, `payment-intents`, `provider-adapters`, `reconciliation`, `persistence`, `http`, `messaging`.

## Contracts
Versioned public DTOs/commands/events/errors live in `@stackra/contracts`; payment-provider types never cross the service boundary.

## Runtime
NestJS `api` for management and billing queries; `consumer` for lifecycle events; `worker` for invoice/payment/reconciliation processing; `scheduler` for period transitions and retryable billing jobs.

## Persistence
Dedicated database, transactional state machine for subscription/payment lifecycle, unique external/provider IDs, immutable invoice numbering, migrations plus outbox in the same transaction.

## Reliability
Idempotent payment commands and webhook processing, bounded provider retries, DLQ, reconciliation against provider truth, explicit compensation/refund states, graceful shutdown and connection draining.

## Security / tenancy
Tenant-scoped financial records, least-privilege provider credentials, webhook signature verification, encryption for secrets, no payment secrets or full financial payloads in telemetry.

## Observability / testing
OTel traces and metrics for billing operations, provider latency/error rate, reconciliation drift and queue lag. Test domain invariants, provider adapters, webhook replay, concurrency, tenant isolation, migrations and e2e flows.

## Deployment
Immutable Docker images, Terraform-managed secrets/network/queues/observability, health-gated rollout and migration compatibility. No provider placeholder in production.

## Exit criteria
Production-ready billing lifecycle with real adapters, durable reconciliation, complete contracts and tested failure paths.
