---
status: canonical
document: service-runtime-manifest
service: iam
version: v1
---
# IAM Service — Canonical Runtime Manifest

## Runtime roles
`api`, `consumer`, `worker`, `scheduler` from one NestJS source tree.

## Controllers
`AuthorizationController`, `RolesController`, `PermissionsController`, `PoliciesController`, `GrantsController`, `AdministrationController`, `HealthController`.

## Application workflows
Authorization check/check-many/require; role create/update/delete/assign/revoke/list; permission list/resolve/bootstrap validation; policy create/update/publish/disable/list/evaluate; grant create/revoke/expire/list; resource-context normalization; model-version bump; cache invalidation/rebuild.

## Messaging/consumers
All subjects and consumers in `11-messaging.md`, including Tenant/Identity invalidation inputs and IAM model events. Each has explicit handler, durable name, idempotency/inbox, retry/DLQ and metric ownership.

## Workers/schedules
Expired grant scanner; derived authorization-state rebuild; decision-record retention/partition maintenance; permission catalog integrity check; cache reconciliation; outbox publisher; DLQ controlled replay. Schedulers only enqueue/trigger bounded idempotent work.

## Notifications/realtime
Keys/channels in `12-notifications-and-realtime.md`, including privileged grant/policy security communication and authorization-model/current-principal channels.

## Framework inventory
Middleware: request/correlation, proxy/security/body limits, principal context, tenant context, logging context.
Guards: authentication, service identity, IAM administration/bootstrap authorization, tenant boundary, assurance.
Pipes: strict validation, UUID, permission/action/resource key, policy AST, pagination.
Interceptors: context, tracing, metrics, idempotency, audit context, serialization, timeout, decision telemetry.
Filters: domain, validation, authorization denied, dependency, conflict, rate limit, unknown.
Observers: model version, cache invalidation, grant expiry, permission catalog validation, tenant/resource/principal/delegation invalidation, outbox.

## Infrastructure
PostgreSQL repositories/UoW/outbox/inbox; Redis decision cache/version store; NATS publisher/consumers; Tenant contract client; Notifications/Audit event outputs; Registry and OTel adapters.

## Health
API readiness: DB/evaluator/catalog integrity. Consumer readiness additionally requires NATS. Redis degraded state is visible but cache can fall back authoritative. Registry/OTel informational. Tenant dependency is checked per operation rather than a startup prerequisite.

## Zero-hidden-runtime rule
No dynamic permission string outside catalog, no arbitrary policy code, no undocumented consumer/schedule, no direct notification provider, no service implementation import, no authorization data in Registry, no stale-cache allow behavior.