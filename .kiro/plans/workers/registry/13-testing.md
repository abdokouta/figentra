# Registry — Testing Contract

## Unit
Manifest parser/validator/sanitizer/canonicalizer/hash; route resolver; version compatibility; publication idempotency; permission metadata; cache key generation; error mapping.

## Integration
D1 migrations/constraints/transactions; KV cache; Service Bindings; queue/reconciliation; authentication fixtures; publication/projection consistency.

## Contract
OpenAPI request/response schemas; manifest schemas; Registry SDK/NestJS publication client; Gateway discovery client; version compatibility and error-code stability.

## Security
Cross-tenant publication, forged identity, replay, secret/code/SQL injection, SSRF, XSS branding, cache poisoning, oversized payloads, route takeover and authorization bypass.

## E2E
Register application → version → environment → publish manifest → resolve host/route/capability → deploy metadata → supersede/revoke → recover/rebuild cache.

## Reliability/load
Concurrent publications, duplicate requests, high read load, cache outage, D1 outage, Worker restart, malformed records, publication burst and recovery. Verify p95/p99, limits and no stale unsafe route.

## Acceptance
Every route and failure mode has automated coverage and tests execute against actual Worker/D1/KV semantics before production.