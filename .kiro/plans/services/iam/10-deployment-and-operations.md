# IAM Service — Deployment & Operations

One NestJS source tree runs `api`, `consumer`, `worker`, and `scheduler`. Docker images are immutable; development, staging and production are isolated.

## Configuration
Database/NATS/Redis endpoints, pool sizes, policy limits, cache TTLs, OTel, logging, rate limits, stream names and service authentication are schema-validated and secret-backed. No policy or credential secret is committed.

## Startup/readiness
Validate configuration, connect required dependencies, verify policy catalog, register routes and expose liveness/readiness. Authorization readiness is false if authoritative persistence is unavailable.

## Rollout
Run expand migrations, deploy compatible consumers/workers, deploy API, then scheduler. Verify permission catalog, authorization allow/deny smoke tests, cache invalidation, event publication and metrics before promotion.

## Scaling
API scales by latency/throughput; consumers by stream lag; workers by queue depth. Keep bounded evaluator memory, DB pools and per-tenant administrative concurrency. Cache is an optimization, never the source of truth.

## Rollback/recovery
Rollback only across schema/event-compatible versions. Restore PostgreSQL with verified backups/PITR. Rebuild cache from authoritative state. Replay outbox/NATS messages idempotently. Never weaken deny-by-default during incident recovery.

## Runbooks
Policy publication failure; authorization latency spike; cache invalidation lag; NATS backlog; DB exhaustion; stale-version rejection; DLQ recovery; suspected privilege escalation. Each procedure preserves authoritative state and records security-significant actions.

## Release gate
All unit/property/integration/contract/security/E2E/load suites green; migrations verified; no unresolved high-severity findings; observability and rollback validated; production authorization smoke tests pass.