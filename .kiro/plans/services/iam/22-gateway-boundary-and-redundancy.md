---
status: canonical
document: gateway-boundary-and-redundancy
service: iam
version: v1
---
# IAM Service — Gateway Boundary and Redundancy Contract

## 1. Boundary
The Cloudflare Gateway is the public edge transport boundary. IAM remains the sole authoritative authorization authority. Gateway admission controls never replace IAM evaluation.

## 2. Request and trust context
Gateway owns generation/propagation of request IDs, W3C trace context, public CORS, edge security headers, transport body limits and coarse edge rate limiting. IAM consumes trusted propagated context, validates trusted-proxy boundaries, and never replaces a valid request ID. Client-provided role, permission, policy-result, authorization-decision or tenant headers are untrusted.

## 3. Authentication and authorization
Gateway may prevalidate credentials. IAM requires an authenticated Identity-established principal/service identity and performs authoritative authorization evaluation, tenant/resource checks, policy evaluation, grants, denies, expiry and fail-closed behavior. Gateway MUST NOT cache or manufacture final IAM decisions.

## 4. Middleware/guards remain service-side
IAM retains forwarded-header trust validation, principal/context extraction, tenant context validation, strict DTO/policy AST validation, authentication/service-identity/admin/bootstrap guards, request/trace context, authorization-decision telemetry, timeout, idempotency and stable error filters. These are service invariants, not edge duplicates.

## 5. CORS/rate/body controls
Public CORS and coarse edge traffic controls belong to Gateway. IAM does not reproduce a competing public CORS policy or global edge limiter. IAM still enforces bounded authorization batches, policy AST limits, decision timeouts, privileged mutation limits and any security invariant required for safe direct/internal ingress.

## 6. Logging/tracing
Gateway records transport facts. IAM records authorization/application facts including action/resource/result/reason/policy version. OTel spans continue through IAM evaluation, cache, DB, NATS and jobs using propagated trace/correlation context. No separate ID namespace or sensitive-policy telemetry is permitted.

## 7. Errors and idempotency
Gateway may normalize transport envelopes; IAM owns authorization reason/error semantics and retryability. Gateway forwards idempotency keys; IAM owns mutation idempotency storage. Authorization uncertainty remains deny/dependency failure regardless of Gateway behavior.

## 8. Registry
IAM publishes its route/OpenAPI, resource/action catalog, permission catalog, policy schema, events, consumers, jobs, schedules, settings, health and dependency metadata. Registry is discovery/projection only. IAM remains authoritative for permissions, policies, grants and decisions. Gateway consumes route metadata and never becomes an authorization data store.

## 9. Direct/internal ingress
IAM endpoints remain secure without Gateway. Internal callers require service authentication; tenant/resource context is independently validated; no `X-*` header can grant authorization. Direct access must preserve the same fail-closed semantics.

## 10. Tests
Test Gateway→IAM context propagation, trace continuity, forged decision headers, token prevalidation versus authoritative Identity context, IAM fail-closed behavior, tenant/resource isolation, duplicate CORS/rate policies, error normalization, idempotency ownership, Registry projection and direct-ingress security.

## 11. Forbidden duplication
No final authorization in Gateway; no IAM policy implementation in Gateway; no trust of Gateway authorization headers; no public CORS/rate-limit duplicate; no separate request/trace context; no Registry authority over IAM state.