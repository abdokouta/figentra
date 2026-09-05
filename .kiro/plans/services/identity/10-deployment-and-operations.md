# Identity Service — Deployment & Operations

## Runtime
One NestJS application exposes `api`, `consumer`, `worker`, and `scheduler` roles from the same source tree. Container images are immutable and promoted across isolated development, staging and production environments.

## Configuration
Required configuration includes environment, database URL/pool limits, NATS URL/credentials, Redis where enabled, Supabase issuer/audience/JWKS configuration, webhook verification configuration, secret-manager references, OTel exporter, log level, rate-limit policy and allowed CORS/origin configuration. Secrets are injected from the secret manager, never committed.

## Startup
Validate configuration schema, establish database/NATS dependencies, load provider verification metadata, register routes, and expose liveness/readiness. Readiness remains false when a required authoritative dependency is unavailable.

## Deployment
Apply backward-compatible database migrations before application rollout. Deploy consumers/workers compatible with both old/new event schemas, then API, then scheduler. Verify readiness, authentication smoke tests, event publication and key metrics before promotion.

## Scaling
API scales on request rate/latency; consumers on stream lag; workers on queue depth; scheduler remains singleton/leader-coordinated. Provider concurrency is bounded. Database pool limits are enforced per role.

## Rollback
Application rollback is safe only while schema/event compatibility holds. Failed migrations use documented recovery rather than ad-hoc SQL. Provider configuration rollback is versioned. Never roll back security validation to an older weaker policy.

## Incident runbooks
Provider outage: fail closed, verify provider status, preserve local security evidence, restore dependency and reconcile. Token/JWKS issue: stop accepting unverifiable credentials, rotate/reload metadata, validate before reopening. Webhook backlog: inspect stream/DLQ, restore consumer, replay idempotently. Credential compromise: revoke credential, invalidate affected service/session state, rotate, audit.

## Health
Liveness checks process health. Readiness checks database, NATS and provider verification dependencies required for the active role. Health endpoints never disclose credentials or internal topology.

## Recovery
Maintain tested PostgreSQL backups/PITR, NATS replay capability, provider reconciliation and DLQ recovery. Document RPO/RTO in the production environment and test restore procedures before release.

## Release gate
Production promotion requires green unit/integration/security/E2E/load suites, migration verification, no unresolved high-severity findings, valid observability, working rollback/recovery and successful authentication smoke tests.