---
status: canonical
document: service-configuration-registry
service: iam
version: v1
---
# IAM Service — Configuration and Application Registry Contract

All configuration is typed/validated before role startup; modules do not read arbitrary environment variables directly.

## Settings
Core: service/version/environment/runtime role, HTTP bind, request/shutdown timeouts, body limits. Database: URL secret, pool/connect/statement/idle/migration-lock timeouts. NATS: URL/credentials, reconnect/publish timeout, stream prefixes, outbox/consumer controls. Redis: URL secret, decision-cache/invalidation/lock/rate settings. Authorization: bounded batches, policy AST limits, decision timeout/cache/stale-version policy, hierarchy/grant limits and privileged assurance. Security: trusted proxies/origins, rate limits, idempotency and service identity. Observability and Registry: OTel/log settings and Registry URL/application/service IDs/timeout/refresh/retry.

Security defaults are fail-closed. Production refuses unlimited AST/batches, missing database settings or insecure service authentication.

## Registry projection
IAM registers modules/capabilities, routes/OpenAPI digest, resource types/actions, permission catalog, policy schema, emitted/consumed events, streams/subjects/consumers/DLQs, workers/jobs/schedules, notifications/realtime, settings, dependencies/health and authorization model version. Registry indexes metadata; IAM remains authoritative for roles, permissions, policies, grants and decisions.

## Gateway boundary metadata
Registry records which routes require edge admission and which require service-authoritative IAM. Gateway may consume route/authentication-admission metadata but MUST NOT consume permission state as a replacement for IAM. No registry projection grants an allow decision. Request/trace propagation is documented; valid upstream IDs are never replaced. Public CORS/WAF/coarse rate-limit settings are Gateway-owned, not IAM authorities.

## Permission catalog registration
Permission definitions are immutable-key, versioned code/contract artifacts. Startup validates duplicate/conflicting definitions. Registry receives projections only; permission state is never imported from Registry.

## Registration lifecycle
Manifest generation is deterministic. Duplicate IDs, route/action conflicts, invalid permission keys or conflicting durable consumer names fail local validation. Registry failure does not block IAM startup; retries use backoff+jitter.

## Tests
Configuration safety, no-secret projection, manifest snapshots, Gateway route-consumption contracts, explicit edge-vs-service authorization metadata, forged-header rejection and direct-ingress fail-closed behavior are required.