---
status: canonical
document: gateway-boundary-and-redundancy
service: tenant
version: v1
---
# Tenant Service — Gateway Boundary and Redundancy Contract

## 1. Boundary
Gateway is the public Cloudflare edge boundary. Tenant remains authoritative for tenant lifecycle, memberships, domains, settings and authoritative tenant context. Edge routing and transport policy are not business logic.

## 2. Request context
Gateway generates missing request IDs and propagates W3C trace/correlation context. Tenant consumes trusted context and never replaces a valid request ID. Tenant IDs supplied by clients or headers are requested context only until validated against route/resource, membership and IAM rules.

## 3. Authentication/authorization
Gateway may prevalidate authentication. Tenant independently establishes/consumes trusted Identity context and calls IAM for authoritative authorization. Gateway does not decide membership, tenant lifecycle, cross-tenant access or administrative permission.

## 4. Middleware/guards/pipes
Tenant retains forwarded-header trust validation, body limits, principal extraction, tenant-context validation, authentication/service-identity/tenant-boundary/IAM/lifecycle/assurance guards, strict DTO/domain pipes, request/trace context, context-version handling, idempotency, timeout, serialization and error filters. These remain required service invariants.

## 5. CORS/rate limits
Gateway owns public CORS, edge security headers and coarse traffic limiting. Tenant does not maintain a competing public CORS or global edge limiter. Tenant retains resource/business limits, bounded settings/domain operations and security protections required for direct/internal ingress.

## 6. Logging/tracing
Gateway logs transport facts. Tenant logs lifecycle, membership, domain and context-resolution application facts. OTel spans continue through application handlers, DB, cache, NATS, DNS verification and jobs using propagated trace/correlation IDs. Tenant IDs and principal IDs are logged only under classification rules.

## 7. Errors/idempotency
Gateway normalizes transport errors. Tenant owns tenant-state, conflict, validation and domain error semantics and idempotency persistence. Gateway forwards idempotency keys and must not own tenant operation state.

## 8. Registry
Tenant publishes routes/OpenAPI, tenant-context capabilities, permissions consumed, events, consumers, jobs, schedules, settings, health and dependency metadata. Registry indexes projections; Tenant remains authoritative for tenant state, memberships, domains and settings. Gateway consumes route metadata only.

## 9. Direct/internal ingress
Tenant remains secure when called without Gateway. Trusted-proxy boundaries, authentication, tenant scope and IAM authorization are enforced service-side. No Gateway-only header can establish tenant authority.

## 10. Tests
Verify propagated request/trace IDs, forged tenant headers, Gateway prevalidation versus service authentication, IAM enforcement, direct ingress, CORS/rate-limit boundary, idempotency ownership, Registry completeness, cross-tenant isolation and graceful error normalization.

## 11. Forbidden duplication
No tenant lifecycle logic in Gateway; no final tenant authorization at edge; no trust of tenant headers; no public CORS duplicate; no separate trace/request-ID system; no Registry ownership of tenant domain state.