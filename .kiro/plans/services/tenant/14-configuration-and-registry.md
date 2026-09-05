---
status: canonical
document: service-configuration-registry
service: tenant
version: v1
---
# Tenant Service — Configuration and Application Registry Contract

## Configuration
Typed settings include core service/version/environment/runtime-role/HTTP/shutdown limits; PostgreSQL URL/pool/timeouts; NATS credentials/reconnect/publish/outbox/consumer limits; Redis cache/lock/rate-limit configuration; tenant lifecycle/member/domain limits; verification challenge/timeout/retry; context-cache/versioning; invitation/action TTL; idempotency; security/trusted proxy/origin/assurance; OTel; Registry connection/refresh/retry.

Production rejects missing required dependencies, unsafe domain verification, unbounded payloads or insecure proxy/origin configuration. Secrets are secret-manager references and never Registry values.

## Registry projection
Tenant registers application/service/version/environment/runtime roles, modules/capabilities, every HTTP route/OpenAPI digest, tenant resource types and IAM permissions consumed, events/streams/subjects/consumers/DLQs, jobs/workers/schedules, notification/realtime channels, settings schema, health/readiness dependencies, domain-verification metadata and dependency graph. Registry is descriptive only and never stores authoritative tenant state.

## Gateway boundary metadata
Registry route metadata distinguishes public edge admission from service-authoritative tenant checks. Gateway may use route metadata for routing/admission, but tenant context, membership and IAM authorization remain Tenant/IAM authorities. Public CORS/WAF/coarse edge limits are Gateway-owned. Manifest records request/trace propagation and direct/internal-ingress requirements without treating forwarded tenant headers as trusted authority.

## Settings ownership
Tenant-owned tenant settings are explicit domain settings rows/API, distinct from service operational configuration. Every tenant setting has schema/version/type/default/range, IAM permission, audit classification and context-version behavior. No arbitrary JSON setting silently changes security behavior.

## Registration lifecycle
Manifest discovery is deterministic, locally validated and idempotent by application/service/version/environment. Duplicate route/capability/consumer/schedule/settings IDs fail local validation. Registry network failure is non-blocking and retried with backoff+jitter.

## Tests
Configuration safety, no-secret projection, tenant-setting authorization, manifest snapshots, Gateway route-consumption metadata, forwarded-header rejection, direct-ingress security and edge-vs-service boundary tests are required.