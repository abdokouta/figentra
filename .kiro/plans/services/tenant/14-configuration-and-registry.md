---
status: canonical
document: service-configuration-registry
service: tenant
version: v1
---
# Tenant Service — Configuration and Application Registry Contract

## Configuration
Typed settings include core service/version/environment/runtime-role/HTTP/shutdown limits; PostgreSQL URL/pool/timeouts; NATS credentials/reconnect/publish/outbox/consumer limits; Redis cache/lock/rate-limit configuration; tenant lifecycle limits; organization/member/domain limits; domain verification challenge TTL, retry interval/max attempts, resolver/request timeout; context-cache TTL/versioning; invitation/action TTL; idempotency TTL; security/trusted proxy/origin/rate-limit/assurance policy; OTel; Registry connection/refresh/retry.

Production rejects missing DB/NATS credentials where the active role requires them, invalid domain-verification safety constraints, unlimited member/domain payloads or insecure proxy/origin configuration. Secrets are secret-manager references and never Registry values.

## Registry projection
Through `@stackra/nestjs`, Tenant registers:
- application/service/version/environment/runtime roles;
- modules/capabilities;
- every HTTP route/OpenAPI digest;
- tenant resource types and IAM permissions consumed;
- events/streams/subjects/consumers/DLQs;
- jobs/workers/schedules;
- notification keys and realtime channels;
- settings schema/feature flags;
- health/readiness dependencies;
- compile/runtime/service/external dependencies;
- domain-verification webhook/callback metadata if any;
- tenant-context schema/version metadata.

Registry is descriptive only and never stores authoritative tenant, organization, membership, domain or settings values.

## Settings ownership
Tenant-owned tenant settings are explicit domain settings rows/API, distinct from service operational configuration. Every tenant setting has schema key/version/type/default/allowed range, IAM permission, audit classification and whether it changes tenant-context version. No generic arbitrary JSON setting may silently change security behavior.

## Registration lifecycle
Manifest discovery is deterministic, validated locally and idempotent by application/service/version/environment. Duplicate route/capability/consumer/schedule/settings IDs fail local validation. Registry network failure is non-blocking and retried with backoff+jitter.

## Tests
Configuration boundary tests, production-safe-default tests, no-secret logging/Registry tests, tenant-settings schema/authorization tests and Registry manifest snapshots cover every controller/event/consumer/job/schedule/notification/realtime/settings/dependency.