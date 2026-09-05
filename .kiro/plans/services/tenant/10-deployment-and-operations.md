# Tenant Service — Deployment & Operations

One NestJS source tree, runtime roles `api`, `consumer`, `worker`, `scheduler`. Immutable container images and isolated development/staging/production environments.

Configuration: PostgreSQL/NATS/Redis endpoints, pool/concurrency limits, domain-verification settings, challenge TTL, rate limits, OTel, logging and service authentication are schema-validated; secrets come from the secret manager.

Rollout: expand migrations → compatible consumers/workers → API → scheduler. Verify tenant lifecycle, membership, context resolution, domain verification, event publication and readiness before promotion.

Scaling: API by latency; consumers by stream lag; workers by queue depth; domain verification concurrency bounded per tenant/provider. DB pools bounded by role.

Rollback: only schema/event-compatible versions. Rebuild cache from Tenant database. Replay events idempotently. Never resurrect an archived tenant through rollback logic.

Runbooks: domain verification outage, membership/context inconsistency, NATS backlog, DB saturation, outbox failure, cache corruption, DLQ recovery, suspected tenant isolation breach.

Health: liveness is process health; readiness checks authoritative DB and required messaging dependencies. No topology/secrets are disclosed.

Recovery: tested PostgreSQL PITR/restore, NATS replay, cache rebuild and reconciliation. Production release requires all tests, migration compatibility, security review, observability, rollback and recovery validation.