---
status: canonical
document: service-runtime-manifest
service: identity
version: v1
---
# Identity Service — Canonical Runtime Manifest

## 1. Purpose
This is the human-readable canonical inventory that code discovery and Registry projection must match. CI fails when an implemented runtime artifact is missing from the inventory or the inventory references a nonexistent artifact.

## 2. Runtime roles
- `api`: HTTP controllers, provider callbacks/webhooks, health/readiness, OpenAPI.
- `consumer`: durable NATS consumers and event handlers.
- `worker`: reconciliation, expiry, credential rotation and DLQ/recovery work.
- `scheduler`: bounded recurring triggers only; business work is delegated to idempotent worker commands.

## 3. Controllers
`AuthController`, `MeController`, `SessionsController`, `IdentitiesController`, `ServiceIdentitiesController`, `DelegationsController`, `ProviderWebhooksController`, plus platform `HealthController` and metadata endpoint only if required by `@stackra/nestjs` convention.

## 4. Application workflows/use cases
Authenticate/sign-in; callback completion; verify access token; refresh session; sign out; global/session-family revoke; resolve current principal; list/revoke sessions; link/unlink identity; create/rotate/revoke service identity; create/revoke delegation; disable/recover account; accept/reject provider webhook; reconcile provider state.

## 5. Domain observers/handlers
Session replay observer; provider-security-state observer; principal-disable session-revocation handler; identity-link security-notification handler; outbox event projector; cache invalidation handlers. No hidden ORM observer performs external I/O.

## 6. Messaging
Streams/subjects/consumers/DLQs are exactly those in `11-messaging.md`. Every consumer has an implementation handler, idempotency repository/inbox mechanism, metric set and integration test.

## 7. Jobs and schedules
Session expiry; provider reconciliation; stale provider-event reconciliation; service-identity credential rotation due scan; expired delegation closure; security metadata cleanup; outbox publishing/recovery; DLQ administrative replay. Cadences, concurrency, locks, retry and batch semantics are defined in `06-jobs-and-scheduling.md` and configuration.

## 8. Notifications and realtime
All keys/channels are defined in `12-notifications-and-realtime.md`; runtime discovery registers them and tests route/handler coverage.

## 9. Framework cross-cutting artifacts
Middleware: request/correlation IDs, forwarded-header trust, security headers, body limit, principal extraction, tenant hint, access-log context.
Guards: authentication, service identity, IAM authorization, assurance, delegation.
Pipes: strict validation, UUID, pagination, provider identifier, locale.
Interceptors: request context, tracing, metrics, audit context, idempotency, serialization, timeout, redaction.
Filters: domain, validation, provider dependency, authorization, rate limit, unknown.

## 10. Infrastructure adapters
PostgreSQL repositories/UoW/outbox, Redis cache/rate/replay adapters, NATS JetStream publisher/consumer adapters, Supabase identity provider, secret manager, IAM client, Tenant client, Notifications event/request publisher, Audit event publisher/projection, Registry client, OTel exporters.

## 11. Health/readiness
Liveness validates process/event loop only. Readiness requires database and role-critical local dependencies; NATS is readiness-critical for consumer role, while Registry and OTel are informational/degraded. Provider health is represented separately and does not invent auth success.

## 12. No hidden runtime
No cron outside scheduler inventory, no ad-hoc queue, no undocumented controller, no direct SMTP/Slack/SMS, no direct service database access, no provider SDK outside Identity infrastructure, no worker application outside this NestJS source tree.