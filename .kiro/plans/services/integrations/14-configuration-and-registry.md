---
status: canonical
document: service-configuration-registry
service: integrations
version: v1
---
# Integrations Service — Configuration and Application Registry Contract

## Configuration
Typed settings include service/version/environment/runtime-role/HTTP/shutdown; PostgreSQL; NATS; Redis; provider timeouts/concurrency/circuit breakers/retry; webhook body/signature/dedupe; sync/reconciliation limits; mapping limits; outbound URL/host allowlists and SSRF controls; credentials; idempotency; notifications/realtime; OTel; Registry. Provider-specific non-secret config is adapter-schema validated. Secrets are secret-manager references only.

## Registry projection
Integrations registers modules/capabilities/runtime roles, HTTP routes/OpenAPI, provider catalog/capabilities, connection schemas, IAM permissions/resources consumed, webhook metadata, approved egress metadata, events/streams/subjects/consumers/DLQs, workers/jobs/schedules, notification/realtime channels, settings and dependency/health metadata. Registry never stores credentials, tokens, raw payloads, checkpoints or authoritative connection state.

## Gateway boundary metadata
Registry explicitly separates Gateway edge admission from Integrations-authoritative provider and business controls. Gateway may route and prevalidate but cannot replace provider signature verification, IAM authorization, SSRF/egress policy or connection ownership. Public CORS/WAF/coarse rate controls are Gateway-owned. Manifest records request/trace propagation and direct/internal ingress requirements. Valid IDs are never replaced.

## Provider catalog
Each provider declares stable key, capabilities, auth method, credential references, webhook support/event types, sync directions/entities, rate semantics, idempotency, pagination, timeout/retry classification and egress host allowlist. Authentication providers such as Supabase Auth remain Identity-owned.

## Registration lifecycle
Manifest discovery is deterministic/idempotent. Duplicate provider keys, route IDs, webhook mappings, consumers or schedules fail local validation. Registry outage never blocks service startup; retry/degraded telemetry applies.

## Tests
Config safety/fuzz tests, no-secret projection, manifest snapshots, Gateway route-consumption contracts, forged provenance/header tests, direct-ingress security, provider verification and edge-vs-service boundary tests are required.