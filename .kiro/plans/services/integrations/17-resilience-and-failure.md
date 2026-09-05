---
status: canonical
document: service-resilience
service: integrations
version: v1
---
# Integrations Service — Resilience and Failure Contract

Integrations treats external providers as unreliable by default. Every call has explicit timeout, retry eligibility, circuit-breaker classification, concurrency/rate limit and idempotency semantics.

| Failure | Required behavior |
|---|---|
| PostgreSQL unavailable | readiness false for stateful operations; no provider mutation without durable local intent/result tracking |
| Redis unavailable | bypass cache; lock/rate-coordination-sensitive work defers if invariant cannot be maintained |
| NATS unavailable | state mutations retain outbox; consumers degrade |
| Secret Manager unavailable | credentialed provider operations fail; never fall back to logged/cached plaintext secret |
| Provider timeout/5xx | retry only if safe; circuit breaker/backoff; connection/job becomes degraded/failed only by explicit policy |
| Provider 429 | honor Retry-After/provider rate semantics; no retry storm |
| IAM/Tenant unavailable | protected/context-required operations fail closed |
| Registry/OTel unavailable | continue with retry/degraded telemetry |

## Timeouts/retries
Separate connect, request and whole-operation deadlines. Safe GET/list/checkpoint reads may retry. Mutations retry only when provider supports idempotency or a deterministic external idempotency key/reconciliation strategy exists. Redirects are bounded and revalidated for SSRF safety.

## Circuit breakers/bulkheads
Per provider and, where necessary, per tenant/connection concurrency pools prevent one degraded provider/tenant from exhausting all workers. Circuit state is observable and does not erase queued intent. Half-open probes are bounded.

## Backpressure
Webhook body/concurrency, provider call concurrency, sync page/item batch, reconciliation batch, outbox publish, consumer max pending and scheduler dispatch all have hard bounds. Saturation leaves work durable rather than allocating unbounded memory.

## Idempotency/recovery
Webhook event IDs/body digests, sync job IDs/checkpoints, reconciliation IDs and outbound mutation idempotency keys are persisted. Consumer crash after DB commit before ack replays safely. Partial provider success is resolved by reconciliation, never guessed.

Connection revocation wins over queued work: workers re-read current connection/version before each externally mutating step and stop when revoked/superseded.

## Chaos tests
Inject DNS/connect/TLS/request timeout, provider 429/401/403/409/5xx, malformed pagination, duplicate/out-of-order webhook, secret-manager outage, Redis/NATS restart, DB disconnect mid-state transition, worker crash after provider success before local commit, revoked connection during sync and shutdown during provider call.