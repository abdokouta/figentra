---
status: canonical
document: service-runtime-manifest
service: tenant
version: v1
---
# Tenant Service — Canonical Runtime Manifest

## Runtime roles
`api`, `consumer`, `worker`, `scheduler` from one NestJS source tree.

## Controllers
`TenantsController`, `OrganizationsController`, `MembershipsController`, `DomainsController`, `TenantSettingsController`, `TenantContextController` (internal/approved), `HealthController`.

## Application workflows
Create/update/activate/suspend/archive tenant; organization create/update/archive; invite/add/update/remove/list membership; domain create/request verification/verify/remove/list; read/update settings; resolve authoritative tenant context; bump context version; reconcile memberships/domains/context; archive cleanup.

## Messaging
All Tenant event/command/DLQ subjects and durable consumers in `11-messaging.md`, including principal lifecycle reconciliation inputs. Every handler has inbox/idempotency, retry/DLQ, tracing and metrics.

## Workers and schedules
Domain verification worker; expired verification-challenge cleanup; membership invitation expiry; tenant-context reconciliation; archived-tenant cleanup/retention orchestration; outbox publisher; cache reconciliation; DLQ replay administrative job. Schedulers enqueue occurrence-keyed bounded jobs; no hidden cron.

## Notifications/realtime
All notification keys and channels in `12-notifications-and-realtime.md`, including lifecycle, membership invitation/removal and domain verification communications.

## Framework inventory
Middleware: request/correlation, proxy/security/body limit, principal and tenant requested context, access log.
Guards: authentication, service identity, tenant boundary, IAM authorization, tenant lifecycle, assurance.
Pipes: validation, UUID, tenant slug, domain, membership input, setting patch, pagination, locale.
Interceptors: context, tracing, metrics, idempotency, audit, context-version, serialization, timeout.
Filters: domain, validation, tenant state, authz, conflict, dependency, rate limit, unknown.
Observers: lifecycle/context-version, membership invalidation, domain state, settings revision, Identity reconciliation, outbox/cache.

## Infrastructure adapters
PostgreSQL repositories/UoW/outbox/inbox, Redis context/cache/locks, NATS publisher/consumers, IAM and Identity clients, DNS/domain verification adapter, Notifications/Audit outputs, Registry and OTel.

## Health
Database is readiness-critical. NATS is critical to consumer role. Redis/DNS are degraded/conditional with explicit operation behavior. Registry/OTel are informational/degraded. IAM/Identity are request-path dependencies, not startup blockers.

## No hidden runtime
No Scope service, no product business resource ownership, no direct notification provider, no ad-hoc queue/cron, no unregistered setting/capability, no direct access to Identity/IAM databases.