---
status: canonical
document: gateway-service-boundary
worker: gateway
version: v1
---
# API Gateway — Service Boundary and Redundancy Review

## 1. Decision

The Gateway centralizes **edge-global transport concerns**. NestJS services retain **service-local correctness, security and domain concerns**. Apparent duplication is removed only when the duplicated control is truly edge-only. Defense-in-depth controls that protect a service when reached from another trusted network path remain in the service.

## 2. Responsibility matrix

| Concern | Gateway | NestJS service |
|---|---|---|
| request ID | create/normalize at public ingress | preserve/validate; generate only if absent on approved internal ingress |
| correlation ID | create/normalize | preserve/continue |
| W3C trace | start/continue edge span | continue service span |
| access log | edge transport log | application/use-case log, not duplicate edge fields |
| public CORS | authoritative | normally not repeated for private origins |
| public security headers | authoritative | service may set safe defaults but cannot rely on them as public edge policy |
| WAF/bot/IP abuse | authoritative edge | not repeated except domain abuse controls |
| coarse route rate limit | authoritative edge | retain fine-grained principal/tenant/action/provider/domain limits |
| body/header/URL max | coarse global/route bound | retain DTO/file/use-case-specific limits |
| JWT cryptographic prevalidation | early reject | authoritative PrincipalContext/session/security validation remains |
| tenant hint | normalize/forward requested context | authoritative tenant resolution/validation |
| IAM | never final authority | mandatory authoritative check |
| DTO validation | transport-safe only | mandatory strict validation pipes/schemas |
| domain invariants | none | mandatory |
| exception mapping | Gateway-owned transport failures | service domain/application exception filters |
| timeout | edge total/upstream deadline | use-case/database/provider-specific child deadlines |
| retry | safe upstream transport only | business/provider/job retries according to semantics |
| idempotency | validate/forward key | authoritative mutation dedupe/result |
| caching | edge-safe response/metadata | service/domain/cache correctness |
| realtime proxy | transport/session edge | channel authorization/domain event semantics |
| file transport | size/type/stream/direct handoff | file ownership, authorization, metadata, scan/business rules |
| audit | gateway security/transport events only | service emits business/governance facts to Audit |

## 3. What to remove from the five service plans

The five current service runtime plans should be normalized so they do **not** imply that each private NestJS service independently owns the public edge stack.

Remove/reword as service-owned public-edge responsibilities:
- generating a new request/correlation ID unconditionally;
- public CORS policy as primary authority;
- Cloudflare/proxy/WAF/bot handling;
- public HSTS/CSP/header ownership;
- generic global body/URL/header limits already enforced at edge;
- duplicated public IP-based rate limiting;
- duplicate edge access logging;
- treating Registry route resolution as a service middleware concern.

## 4. What must remain in every service

Do **not** remove:
- `RequestContext` creation from trusted propagated metadata;
- request/correlation ID validation and fallback generation for approved direct/internal ingress;
- trace continuation;
- strict DTO/schema validation pipes;
- controller-specific payload/file constraints;
- authentication/service-identity verification at the service boundary;
- authoritative Tenant and IAM guards;
- assurance/delegation/resource guards;
- service/domain rate limits and abuse controls;
- idempotency handling;
- transaction and concurrency control;
- domain exception filters;
- serialization and sensitive-data redaction;
- service metrics/traces/application logs;
- service-specific timeouts/provider circuit breakers;
- health/readiness;
- graceful shutdown;
- NATS consumer/worker/scheduler security and context validation.

## 5. Recommended NestJS ingress pipeline after Gateway

```text
trusted origin/network authentication
 -> validate/adopt requestId + correlationId + trace context
 -> validate signed Gateway/internal context
 -> resolve PrincipalContext / service identity
 -> resolve authoritative TenantContext
 -> strict DTO/schema validation
 -> IAM/resource/assurance/delegation guards
 -> service-specific rate/idempotency/concurrency controls
 -> controller/application handler
 -> domain transaction/outbox
 -> service exception mapping/serialization
 -> application observability
```

This pipeline is smaller than the public Gateway pipeline but remains a complete service security boundary.

## 6. Direct/internal traffic

Not every call necessarily enters through public Gateway: service-to-service calls, NATS consumers, schedulers, tests and operational probes have different ingresses. Therefore deleting service RequestContext/auth/validation/error handling because Gateway has equivalents would create a security/correctness hole.

For internal HTTP, callers propagate canonical context through authenticated service transport. If no public Gateway request ID exists, the first trusted internal ingress creates one. NATS consumers derive correlation/causation/trace context from the event envelope rather than HTTP middleware.

## 7. Logging duplication rule

One request can legitimately produce both:
- Gateway access record: edge/routing/upstream facts;
- Service application record: application/use-case/domain outcome.

It should **not** produce two near-identical access logs. The service logger should avoid duplicating Cloudflare IP/WAF/CORS/cache/routing details and instead log service/module/handler, tenant/principal according to classification, authorization result code, domain outcome, dependency timing and error code.

## 8. Rate-limit duplication rule

Use layered limits with different keys/purposes:
- Gateway: IP/device/token fingerprint/application/route burst and DDoS protection.
- Service: principal/tenant/resource/action/provider/business quota and security-sensitive operation limits.

Do not configure identical IP+route counters in both layers without a documented reason.

## 9. Authentication duplication rule

Gateway token prevalidation is a performance/security filter. Services still validate trusted Identity context or call the canonical Identity verification contract because revocation, disabled principals, session family state, delegation and assurance can change independently of a structurally valid JWT.

## 10. Required review of existing five services

Identity, IAM, Tenant, Audit and Integrations must be reviewed against this matrix. Their `13-runtime-and-framework.md`, `14-configuration-and-registry.md`, observability/security/testing docs should use the same boundary language. The desired result is **shared platform middleware behavior via `@stackra/nestjs`, not five copied custom implementations**.

Cross-cutting service middleware/guards/interceptors/filters should generally be reusable package integrations configured by metadata, while service-specific guards/pipes/filters remain in the service.

## 11. Acceptance

There is no redundancy problem when two layers enforce different trust boundaries. Redundancy is a problem only when two layers claim the same authority or emit/execute the same concern with no distinct threat/correctness purpose.