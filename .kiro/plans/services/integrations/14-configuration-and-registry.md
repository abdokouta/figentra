---
status: canonical
document: service-configuration-registry
service: integrations
version: v1
---
# Integrations Service — Configuration and Application Registry Contract

## Configuration
Typed settings include service/version/environment/runtime-role/HTTP/shutdown limits; PostgreSQL URL/pool/timeouts; NATS credentials/reconnect/publish/outbox/consumer controls; Redis cache/lock/rate-limit settings; global provider connect/request timeout, max concurrent calls, circuit-breaker thresholds, retry/backoff/429 policy; webhook body/time/signature tolerance, dedupe TTL and max payload; sync/reconciliation batch/checkpoint/max-run limits; mapping size/expression limits; outbound URL/host allowlist, redirect policy and DNS/IP SSRF protections; credential-reference/authorization refresh windows; idempotency TTL; notification/realtime limits; OTel; Registry.

Provider-specific non-secret configuration is namespaced by provider key and validated by the adapter schema. Secrets/OAuth tokens/API keys/webhook secrets are secret-manager references only. `process.env` is not read ad hoc inside adapters.

## Registry projection
Integrations registers through `@stackra/nestjs`:
- modules/capabilities/runtime roles;
- HTTP routes/OpenAPI digest;
- integration/provider catalog metadata and capability schemas;
- connection configuration schema metadata;
- IAM permission/resource catalog consumed;
- inbound webhook routes, provider key, verification method and event-type metadata;
- outbound egress capabilities/approved endpoint metadata (never credentials);
- events/streams/subjects/consumers/DLQs;
- workers/jobs/schedules;
- notification keys/realtime channels;
- settings schema/provider configuration schema;
- dependency/health/SLO ownership and manifest version.

Registry never stores connection secrets, OAuth tokens, external raw payloads, sync checkpoints or authoritative connection state.

## Provider catalog
Each production provider declares stable key, display name, capabilities, auth method, credential schema references, webhook support/event types, sync directions/entities, rate-limit semantics, idempotency support, pagination model, timeout/retry classification and egress host allowlist. Authentication providers such as Supabase Auth are explicitly excluded and remain Identity-owned.

## Registration lifecycle
Manifest discovery is deterministic/idempotent. Duplicate provider keys, route IDs, webhook event mappings, consumers or schedules fail local validation. Registry outage never blocks service startup; retry/degraded telemetry applies.

## Tests
Config safety/fuzz tests cover unsafe URLs/redirects, unbounded retries/timeouts/payloads and missing secrets. Registry snapshots prove provider/routes/webhooks/events/consumers/jobs/schedules/notifications/realtime/settings/dependencies completeness and no-secret projection.