---
status: canonical
document: service-resilience
service: identity
version: v1
---
# Identity Service — Resilience and Failure Contract

## 1. Principle
Authentication state is security-sensitive. Identity fails closed whenever trust cannot be established. Availability optimizations may bypass non-authoritative caches, but never weaken credential, replay, tenant or authorization invariants.

## 2. Dependency failure matrix
| Dependency | Failure | Required behavior |
|---|---|---|
| PostgreSQL | unavailable/timeout | readiness false; reject stateful operations; no fabricated session/principal state |
| Redis | unavailable | bypass eligible caches; security counters/replay controls use authoritative fallback or reject if invariant cannot be preserved |
| NATS | unavailable | API writes continue only through committed transactional outbox; consumer role reports degraded |
| Supabase/JWKS | unavailable | cached verified key material only within explicit validity window; unverifiable token fails closed; provider mutations return dependency error |
| IAM | unavailable | privileged operation denied/dependency error; never allow |
| Tenant | unavailable | operations requiring tenant validation fail closed/dependency error |
| Notifications | unavailable | notification request remains durable through event/outbox; identity state is not rolled back solely for notification delivery |
| Registry | unavailable | non-blocking retry and degraded metric |
| OTel | unavailable | service continues with bounded telemetry buffering/drop |

## 3. Timeouts and retries
Every network dependency has connect and total-request timeout. Safe GET/JWKS/reconciliation reads may retry with exponential backoff+jitter. Idempotent mutations retry only with stable idempotency keys. Non-idempotent provider mutations are not automatically retried unless provider semantics prove idempotency.

## 4. Circuit breaking and bulkheads
Provider operations, Registry, Notifications-related async publishing and external reconciliation use isolated connection pools/concurrency limits. Circuit breakers open on configured failure/latency thresholds and probe via half-open requests. Authentication token verification using locally cached verified JWKS is isolated from provider management API health.

## 5. Backpressure
HTTP concurrency, provider calls, webhook ingestion, outbox publishing and consumers have explicit limits. When saturated, the service returns bounded overload errors or leaves durable work queued instead of unbounded memory growth.

## 6. Idempotency
Sign-out/revocation, provider webhook processing, identity linking, service-credential rotation and reconciliation handlers are idempotent. Mutation endpoints requiring idempotency persist request key, principal, route, request digest, response digest/status and expiry; key reuse with a different payload is rejected.

## 7. Recovery
- Outbox publisher resumes unpublished rows after restart.
- Consumers resume durable positions and reprocess safely.
- Provider reconciliation repairs missed webhook/provider drift.
- Session expiry/revocation jobs are resumable with checkpoints.
- DLQ replay requires authorization, audit, reason and bounded selection.

## 8. Chaos/failure tests
Mandatory tests kill PostgreSQL connections mid-transaction, restart NATS during publish/ack, duplicate webhooks, expire JWKS while provider is unavailable, make Redis unavailable, inject provider timeout/429/5xx, crash consumer after DB commit before ack, terminate API during requests, and verify no security state is silently allowed or duplicated.