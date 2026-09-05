---
status: canonical
document: service-configuration-registry
service: iam
version: v1
---
# IAM Service — Configuration and Application Registry Contract

All configuration is typed/validated before role startup; modules do not read arbitrary environment variables directly.

## Settings
Core: service/version/environment/runtime role, HTTP bind, request/shutdown timeouts, body limits.
Database: URL secret, pool/connect/statement/idle/migration-lock timeouts.
NATS: URL/credentials, reconnect/publish timeout, stream prefixes, outbox batch/poll, consumer ack/max-delivery/concurrency defaults.
Redis: URL secret, decision-cache TTL, invalidation namespace, lock/rate-limit settings.
Authorization: max `checkMany` batch, policy AST max depth/nodes/string/set sizes, decision timeout, cache TTL, stale-version policy, hierarchy depth, grant max duration, privileged assurance threshold, decision-record sampling/retention controls.
Security: trusted proxies/origins, rate limits, admin mutation idempotency TTL, service-identity requirements.
Observability and Registry: OTel/log settings; Registry URL/application/service IDs, timeout, refresh/retry.

Security defaults are fail-closed. Production refuses unlimited AST, unbounded authorization batches, missing database settings or insecure service authentication.

## Registry projection
Through `@stackra/nestjs`, IAM registers:
- modules and capabilities;
- routes/OpenAPI digest;
- resource types/actions;
- full permission catalog keys/descriptions/ownership/status;
- policy condition/operator catalog and schema versions;
- emitted/consumed events;
- streams/subjects/consumers/DLQs;
- workers/jobs/schedules;
- notification keys/realtime channels;
- settings schema (never secret values);
- dependencies/health/SLO ownership;
- authorization model/manifest version.

The Registry indexes metadata; IAM remains authoritative for roles, permissions, policies, grants and decisions.

## Permission catalog registration
Permission definitions are immutable-key, versioned code/contract artifacts. Startup validates duplicate/conflicting definitions. Registry receives the catalog projection. Production permission insertion/update occurs through controlled migration/bootstrap, never by trusting Registry contents.

## Registration lifecycle
Manifest generation is deterministic. Duplicate IDs, route/action conflicts, invalid permission keys or conflicting durable consumer names fail local startup validation. Registry network failure does not block IAM startup; retry is exponential with jitter and surfaced as degraded telemetry.

## Tests
Configuration boundary/property tests cover invalid limits, unsafe defaults and missing secrets. Registry snapshot tests prove route/permission/resource/event/consumer/job/schedule/settings/dependency completeness and prove secret/domain-state exclusion.