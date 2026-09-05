---
status: canonical
document: service-configuration-registry
service: audit
version: v1
---
# Audit Service — Configuration and Application Registry Contract

## Configuration
Typed settings include service/version/environment/runtime role; HTTP/shutdown/query timeouts; PostgreSQL URL/pool/statement/migration limits; NATS credentials/consumer ack/max-delivery/concurrency/outbox settings; object-storage bucket/region/KMS/URL-expiry for exports/archives; Redis only for bounded cache/locks if used; chain partitioning/algorithm/canonicalization version; max query range/page/export rows/bytes; integrity batch/cadence; retention/archive/delete batch sizes; legal-hold behavior; export formats/compression/expiry; quarantine thresholds; rate limits/assurance; OTel/logging; Registry connection/refresh/retry.

Production refuses unsupported hash/canonicalization versions, unbounded export/query limits, missing encryption configuration for restricted exports or invalid retention/legal-hold safety settings. Secrets are secret-manager references only.

## Registry projection
Audit registers through `@stackra/nestjs`:
- service/modules/capabilities/runtime roles;
- query/export/integrity/retention/legal-hold routes and OpenAPI digest;
- IAM permissions/resource types;
- accepted auditable event subject patterns/schema versions and Audit-owned subjects;
- durable consumers, quarantine/DLQs, jobs/schedules;
- notification keys/realtime channels;
- export formats/classification controls;
- chain/canonicalization schema versions;
- settings schema, health dependencies, data classifications and dependency graph.

Registry never stores audit records, legal-hold scope contents, exported data, hashes as authoritative evidence, secret values or retention state as source of truth.

## Source event allowlist
Accepted source event types/versions and classification constraints are code/contract-managed and Registry-projected. Unlisted events are not silently accepted as trusted evidence.

## Registration
Manifest is deterministic/idempotent. Local validation rejects duplicate subject ownership, unsupported chain versions, conflicting permissions/schedules and missing schema bindings. Registry outage does not block Audit; retry/degraded state is observable.

## Tests
Config boundary/safety tests, no-secret projection, source allowlist/schema tests and Registry snapshots cover all routes/events/consumers/jobs/schedules/notifications/realtime/settings/dependencies.