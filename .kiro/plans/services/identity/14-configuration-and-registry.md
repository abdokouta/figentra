---
status: canonical
document: service-configuration-registry
service: identity
version: v1
---
# Identity Service — Configuration and Application Registry Contract

## 1. Configuration authority
All runtime configuration is declared in typed schema, validated before role startup, exposed through a single configuration service, and registered as metadata with the Application Registry. No module reads arbitrary `process.env` directly after bootstrap.

## 2. Required settings
Core: `SERVICE_NAME=identity`, `SERVICE_VERSION`, `ENVIRONMENT`, `RUNTIME_ROLE`, `HTTP_HOST`, `HTTP_PORT`, `SHUTDOWN_GRACE_MS`, `REQUEST_TIMEOUT_MS`, `MAX_REQUEST_BODY_BYTES`.
Database: `DATABASE_URL` (secret), pool/timeouts. NATS: URL/credentials, reconnect/publish, streams/consumers, outbox. Redis/cache: URL, TTLs, replay/rate namespaces. Supabase/Auth: URL/project, secret references, issuer/audience/JWKS, skew, provider/webhook timeouts. Security: trusted proxies, origin metadata, authentication limits, session/replay/delegation/assurance/idempotency controls. Observability: OTel/log settings. Registry: URL/application/service IDs, timeout, refresh/retry, integrity configuration.

## 3. Secret handling
Secrets are references only. Registry receives setting metadata (`key`, purpose, required, `secret=true`) and never secret values. Logs and diagnostics redact values by schema classification.

## 4. Settings metadata
Each setting registered with Registry includes key, namespace, type, description, required/default semantics, secret flag, mutability, environment applicability, validation constraints and owning module. Runtime values are never projected unless explicitly public/non-sensitive.

## 5. Registry manifest
Identity publishes application/service identity, version/environment/runtime roles, modules/capabilities, HTTP routes/OpenAPI digest/auth requirements, permissions consumed, event schemas/streams/subjects/consumers/DLQs, workers/jobs/schedules, notification/realtime metadata, provider/webhook endpoints, settings, health/readiness dependencies, package/service dependencies and classifications.

## 6. Gateway boundary
Registry metadata is consumed by Gateway for discovery/route admission; it is not an authorization source. Gateway-owned public CORS, WAF, edge rate limits and transport policy are not represented as Identity-owned runtime authority. Identity metadata must distinguish `edge-admission` from `service-authoritative-authentication` so consumers cannot infer that Gateway prevalidation is sufficient.

Identity manifest records that request/correlation/trace IDs are propagated from Gateway, that valid IDs are not replaced, and that direct/internal ingress still requires service authentication. Registry MUST NOT expose secrets or trust headers as authority.

## 7. Registration lifecycle
Registration is deterministic and idempotent by `(applicationId, serviceId, version, environment)`. Bootstrap discovers static metadata, computes a stable digest, submits it after local initialization and refreshes it. Registry failure is non-blocking with exponential backoff+jitter and degraded telemetry.

## 8. Drift protection
CI compares discovered runtime artifacts with committed contracts. Duplicate routes, permissions, durable consumers, schedules or conflicting metadata fail local validation. Registry outage never blocks Identity startup.

## 9. Testing
Tests cover configuration parsing, secret exclusion, deterministic manifest, Gateway-consumed route metadata, propagation semantics, direct-ingress security, registry outage/retry and discovery of every route/controller/event/consumer/job/schedule/notification/realtime channel.