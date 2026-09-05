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

Database: `DATABASE_URL` (secret), pool min/max, connect timeout, statement timeout, idle timeout, migration lock timeout.

NATS: `NATS_URL`, credentials/secret reference, connection timeout, reconnect bounds, publish timeout, stream/consumer prefixes, outbox batch size, outbox poll interval.

Redis/cache: `REDIS_URL` (secret), connect timeout, command timeout, cache TTLs, token/JWKS cache TTL, rate-limit namespace.

Supabase/Auth: `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY_REF` where required, `SUPABASE_SERVICE_ROLE_KEY_REF` only for privileged server operations, JWT issuer, allowed audiences, JWKS URI, JWKS refresh TTL, clock skew, provider timeout, webhook secret reference.

Security: allowed origins, trusted proxy ranges, rate limits, session inactivity/max age, replay policy, delegation max duration, service-credential rotation age, MFA assurance policy, idempotency TTL.

Observability: OTel endpoint, service namespace, sampling policy, log level, metrics export interval.

Registry: Registry URL, application ID, service ID, registration timeout, refresh interval, retry min/max, metadata signing/integrity configuration if enabled.

## 3. Secret handling
Secrets are referenced through the platform secret-management abstraction. Registry receives only secret **setting metadata** (`key`, purpose, required, secret=true), never secret values. Logs and diagnostics redact values by schema classification.

## 4. Settings metadata
Each setting registered with the Registry includes key, namespace, type, description, required/default semantics, secret flag, mutable/restart-required classification, environment applicability, validation constraints and owning module. Runtime values are never projected unless explicitly classified public/non-sensitive.

## 5. Registry manifest
Identity publishes through `@stackra/nestjs` registry integration:
- application/service identity, version, environment, runtime roles;
- module and capability catalog;
- HTTP routes/methods/version/tags/auth requirements;
- OpenAPI location/digest;
- permissions consumed and administrative permissions exposed;
- event schemas, NATS streams/subjects, consumers and DLQs;
- workers/jobs/schedules;
- notification request keys;
- realtime channels and subscription permissions;
- provider/webhook endpoints and verification mode;
- configuration/settings schema;
- health/readiness dependencies;
- service/runtime/package dependencies;
- data classifications and operational ownership metadata.

Registry receives projections only; it does not become the source of truth for Identity domain data, credentials, sessions, IAM state or provider state.

## 6. Registration lifecycle
Registration is deterministic and idempotent by `(applicationId, serviceId, version, environment)`. Bootstrap discovers static metadata, computes a stable manifest digest, submits it after local initialization, and refreshes it at the configured interval. Metadata changes require a service version/build change or explicit manifest-version change.

Registry timeout/failure does not fail service startup. The service marks a registry-registration metric/state as degraded and retries with exponential backoff and jitter. Health may expose Registry as informational/degraded, never as a false authentication dependency.

## 7. Drift protection
CI generates/discovers the manifest and compares it with committed service contracts. Production startup rejects internally inconsistent metadata (duplicate route IDs, duplicate permission keys, invalid schedule, duplicate consumer durable name), but does not reject solely because Registry is temporarily unreachable.

## 8. Testing
Tests cover configuration parsing, missing/invalid secrets, production-only safety checks, registry manifest snapshot/contract, deterministic digest, retry, non-blocking Registry outage, no-secret projection, and discovery of every route/controller/event/consumer/job/schedule/notification/realtime channel.