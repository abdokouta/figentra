---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# Marketing Service — implementation plan

## Ownership

Marketing owns campaigns, audiences, segments, eligibility, journeys, suppression, scheduling, activation and server-side conversion integrations. It does not own analytical storage or notification delivery.

## Runtime roles

- `api`: campaign/audience management, eligibility queries and authorized control-plane operations.
- `consumer` / `worker`: audience calculation, campaign evaluation, scheduling, activation, provider/API calls, retries and reconciliation.
- Optional scheduler role only when scheduling cannot be represented by the worker/queue model.

All roles use the same `services/marketing` source tree and domain modules.

## Contracts

External consumers use versioned `@stackra/contracts/marketing`. Analytics outputs and Notifications commands are consumed through contracts/transport, never implementation imports.

## Implementation requirements

Implement the complete marketing bounded context with consent/suppression enforcement, tenant isolation, deterministic eligibility, durable campaign state, idempotency, bounded worker concurrency, scheduling, retry/DLQ/reconciliation, notification integration, analytics integration, audit, structured logs, OpenTelemetry, health/readiness, graceful shutdown, security, contract/integration/load tests and production deployment.

## Boundary rule

Analytics answers what happened; Marketing decides what action to take; Notifications delivers the resulting communication. Marketing must not bypass notification consent/preferences or provider security boundaries.
