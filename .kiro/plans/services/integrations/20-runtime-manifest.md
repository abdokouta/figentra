---
status: canonical
document: service-runtime-manifest
service: integrations
version: v1
---
# Integrations Service — Canonical Runtime Manifest

## Runtime roles
`api`, `consumer`, `worker`, `scheduler` from one NestJS source tree.

## Controllers
`IntegrationsController`, `ConnectionsController`, `ConnectionAuthorizationController`, `WebhooksController`, `SyncController`, `MappingsController`, `ReconciliationController`, `ProviderStatusController`, `HealthController`.

## Application workflows
List/read integration definitions; create/update/read/revoke connection; begin/complete provider authorization; rotate/update credential reference; accept/reject/process webhook; request/start/progress/complete/fail/cancel sync; create/update/publish mapping; request/start/complete/fail reconciliation; provider health/capability inspection; tenant lifecycle disable/cleanup.

## Messaging/consumers
Every event/command/DLQ subject and consumer in `11-messaging.md`. Handlers persist inbox/idempotency, validate connection/version, use provider adapter ports, persist resulting state/checkpoints and emit outbox events atomically.

## Workers/schedules
Webhook processing worker; sync worker; reconciliation worker; provider authorization/credential refresh worker; connection health worker; expired webhook/debug payload cleanup; stale sync recovery; outbox publisher; DLQ controlled replay. Schedulers dispatch due health/refresh/reconciliation/sync/cleanup work with occurrence IDs and distributed coordination.

## Notifications/realtime
All keys/channels in `12-notifications-and-realtime.md`, including authorization expiry, connection status, sync/reconciliation outcomes, webhook-security/provider-degraded alerts and connection status/progress channels.

## Framework inventory
Middleware: request/correlation, proxy/security/body limit, raw webhook body, principal/tenant/log context.
Guards: auth, service identity, tenant boundary, IAM, assurance, webhook authenticity, connection ownership.
Pipes: validation, UUID, provider key, connection config, mapping, sync/reconciliation request, pagination, SSRF-safe URL.
Interceptors: context, tracing, metrics, idempotency, audit, serialization, timeout, provider telemetry, redaction.
Filters: domain, validation, authz, provider dependency, webhook verification, rate limit, conflict, unknown.
Observers: connection/credential/webhook/sync/reconciliation/provider-health/tenant-lifecycle/outbox state handlers.

## Infrastructure adapters
PostgreSQL repositories/UoW/outbox/inbox/checkpoints; Redis locks/cache/rate coordination; NATS publisher/consumers; secret manager; provider adapters/SDKs; IAM/Tenant clients; Notifications/Audit outputs; Registry/OTel.

## Health
DB critical. NATS critical for consumer. Secret manager/provider health is operation/provider-specific and reported separately. Redis degraded unless lock invariant requires deferral. Registry/OTel non-blocking.

## Zero-hidden-runtime rule
No authentication provider adapter, no undocumented external host/provider SDK, no raw credentials in DB/messages/logs, no hidden webhook/consumer/cron, no direct notification provider, no synchronous business-service callback cycle, no unregistered capability/setting/dependency.