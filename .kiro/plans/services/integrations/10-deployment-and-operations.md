# Integrations Service — Deployment & Operations

One NestJS source tree runs `api`, `consumer`, `worker`, `scheduler`; immutable Docker images and isolated environments.

Configuration: PostgreSQL/NATS/Redis, secret manager, provider registry, egress allow-list, timeouts, body/response limits, concurrency/rate limits, OTel and service auth. No credentials in repository or image.

Rollout: expand migrations → compatible consumers/workers → API → scheduler. Verify provider connection test, webhook acceptance, sync, reconciliation and egress controls.

Scaling: API by latency; webhook consumers by stream lag; sync/reconciliation workers by backlog. Bound provider concurrency and DB pools.

Rollback: preserve local state; do not blindly repeat ambiguous provider writes. Restore/reconcile from external authoritative state. Schema/event rollback requires compatibility.

Runbooks: provider outage, credential compromise/expiry, SSRF alert, webhook backlog, sync drift, reconciliation discrepancy, rate-limit saturation, DLQ and NATS outage.

Health/readiness verifies database and messaging for active role; provider health is reported as dependency telemetry rather than making every startup dependent on every provider.

Recovery: PostgreSQL PITR, NATS replay, provider reconciliation and checkpoint resume. Production gate requires security/load/E2E tests, migration verification, observability and rollback/recovery validation.