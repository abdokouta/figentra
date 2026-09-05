---
status: canonical
document: gateway-boundary-and-redundancy
service: identity
version: v1
---
# Identity Service — Gateway Boundary and Redundancy Contract

## 1. Boundary
The public API Gateway is the Cloudflare Worker/Hono edge boundary. Identity is the authoritative authentication service behind it. Gateway routing, WAF/edge controls, coarse rate limiting, transport normalization, CORS and request/trace propagation are not duplicated as business logic in Identity.

## 2. Request context
Gateway generates `X-Request-Id` only when absent/invalid and propagates W3C trace context and correlation context. Identity consumes and validates trusted upstream context and MUST NOT replace a valid request ID. Direct/internal ingress must authenticate the caller and may generate a request ID only when none exists. Client-supplied identity, tenant, actor or assurance headers are never trusted merely because Gateway forwarded them.

## 3. Authentication boundary
Gateway may perform token prevalidation/admission. Identity performs authoritative credential verification, provider semantics, session validation, principal resolution, replay handling, delegation and authentication state decisions. A Gateway success signal is never sufficient to authenticate a principal.

## 4. Authorization boundary
Identity does not become an authorization engine. Administrative/domain authorization is authoritative in IAM. Gateway may reject malformed/unauthenticated traffic, but it must not duplicate IAM policy evaluation. Identity preserves actor/effective-subject/delegation context for IAM.

## 5. Middleware and framework responsibilities
Identity retains service-side middleware, guards, pipes, interceptors and filters because requests may arrive through trusted internal paths and because authentication/domain invariants cannot be edge-only. Gateway-owned concerns are not reimplemented as alternate policy engines.

Required service-side controls remain: forwarded-header trust validation; strict body limits; principal extraction; tenant-context hint validation; authentication/service-identity/delegation/assurance guards; strict DTO/domain pipes; request/trace context; timeout; idempotency; serialization; sensitive redaction; stable exception mapping.

## 6. CORS and security headers
Gateway owns public-browser CORS and edge security headers. Identity does not maintain a second public CORS policy. Identity may emit required service/direct-ingress security headers where it is directly exposed or where platform policy requires them. Service behavior must remain safe if Gateway policy is absent.

## 7. Rate limiting
Gateway owns coarse edge traffic protection. Identity owns authentication-abuse limits and security invariants such as refresh/replay protection, credential rotation and provider-specific throttles. Gateway limits cannot replace Identity limits.

## 8. Logging and tracing
Gateway logs transport facts; Identity logs authentication/application facts. Identity continues OTel spans for handlers, provider calls, DB, NATS and jobs and joins the propagated trace. Request/correlation/trace IDs are reused, not regenerated. Secrets, tokens and sensitive claims remain redacted at the service boundary.

## 9. Errors and idempotency
Gateway normalizes transport errors without changing domain meaning. Identity owns authentication/domain error codes, retryability and idempotency persistence. Gateway forwards idempotency keys; it does not own Identity idempotency state.

## 10. Registry
Identity publishes routes, auth requirements, permissions consumed, events, consumers, jobs, schedules, settings, dependencies and health metadata. Registry is a projection/discovery system. Identity remains authoritative for authentication state and credentials. Gateway consumes Registry route metadata but does not mutate Identity metadata.

## 11. Direct/internal ingress
Direct service ingress is treated as hostile until service authentication, trusted-proxy validation and authorization succeed. No assumption that traffic bypassing Gateway is safe is permitted.

## 12. Required tests
Contract tests prove Gateway→Identity propagation; invalid/missing request IDs; trace continuity; forged forwarded/principal/tenant headers; Gateway prevalidation followed by authoritative Identity verification; IAM authorization; duplicate CORS/rate policy prevention; error normalization; idempotency ownership; Registry manifest completeness; direct-ingress security.

## 13. Forbidden duplication
No Gateway routing implementation inside Identity; no public WAF; no second edge CORS policy; no Gateway-style global rate limiter; no edge-final authorization; no trust of Gateway-only auth headers; no separate trace/request-ID universe; no direct business persistence in Gateway.