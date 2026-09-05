---
status: canonical
document: service-resilience
service: iam
version: v1
---
# IAM Service — Resilience and Failure Contract

IAM always prefers false deny/dependency error over false allow.

| Failure | Behavior |
|---|---|
| PostgreSQL unavailable | readiness false for authoritative operations; authorization fails closed unless a cache entry is cryptographically/contextually valid and policy explicitly permits bounded cached evaluation |
| Redis unavailable | bypass derived cache and evaluate authoritative state; never allow from unverifiable stale cache |
| NATS unavailable | mutations commit with outbox; consumers degrade; backlog alerts |
| Tenant dependency unavailable | resource/tenant validations that require it fail closed |
| Registry unavailable | continue; retry with jitter; degraded metric |
| OTel unavailable | bounded telemetry degradation only |

Every external call has connect/request timeout. Only idempotent operations retry automatically. Evaluation has a hard CPU/time budget, AST node/depth/collection limits and no network/filesystem/arbitrary code execution.

Decision-cache entries include tenant, principal, actor/delegation where relevant, action, resource, normalized-context digest, permission/model/resource version and expiry. Any version uncertainty, malformed context or invalidation-lag breach rejects the cache and evaluates authoritative state or denies.

Backpressure limits authorization batch size, concurrent evaluations, policy publication, consumer concurrency and cache rebuild throughput. Overload returns explicit retryable errors; queues do not grow unbounded in memory.

Outbox/inbox and event handlers are idempotent. Grant expiry is checked synchronously in evaluation, so delayed expiry jobs cannot extend privilege. Policy publication uses optimistic concurrency/version checks and transactional model-version bump.

Recovery includes cache flush/rebuild, replay-safe model events, resumable grant-expiry scans, permission catalog validation, DLQ replay with audited authorization and post-restore model integrity verification.

Mandatory chaos tests cover DB loss, Redis loss/stale cache, NATS restart, duplicate/out-of-order model events, policy evaluator timeout, resource-context dependency timeout, concurrent policy publication/grant revocation and process termination during evaluation/consumer ack.