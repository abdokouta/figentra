---
status: canonical
document: service-runtime-framework
service: iam
version: v1
runtime: nestjs
---
# IAM Service — Runtime and NestJS Framework Contract

## Runtime roles
Single NestJS source tree: `api`, `consumer`, `worker`, `scheduler`. No mirrored IAM worker application.

## Modules
`AppModule`, `RuntimeModule`, `ConfigModule`, `DatabaseModule`, `MessagingModule`, `AuthorizationModule`, `RolesModule`, `PermissionsModule`, `PoliciesModule`, `GrantsModule`, `ResourceContextModule`, `DecisionCacheModule`, `SecurityModule`, `RegistryModule`, `ObservabilityModule`, `HealthModule`.

## Middleware order
`RequestIdMiddleware` → `CorrelationMiddleware` → trusted-proxy/security headers/body-limit → trusted `PrincipalContext` extraction → tenant-context extraction/validation → access-log context. Client-supplied role, permission, policy result or authorization-decision headers are rejected/ignored.

Gateway owns public CORS/WAF, route admission and coarse edge rate limiting. IAM retains service-side trust validation, bounded request controls and all authorization invariants. A valid upstream request ID is consumed, never replaced.

## Guards
`AuthenticationGuard`, `IamAdministrationGuard`, `TenantBoundaryGuard`, `AssuranceGuard`, `ServiceIdentityGuard`. Gateway prevalidation cannot satisfy final IAM authorization. The authorization check endpoint avoids recursive self-authorization.

## Pipes
Global strict validation plus `UuidPipe`, `PermissionKeyPipe`, `ActionKeyPipe`, `ResourceIdentifierPipe`, `PolicyAstPipe`, `PaginationPipe`. AST validation rejects unknown operators/fields, excessive depth/size and executable/network/filesystem constructs. Gateway body limits are an additional transport boundary, not a substitute.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`, `AuthorizationDecisionTelemetryInterceptor`. No interceptor may convert evaluation failure into allow. Trace/correlation context continues from Gateway.

## Exception filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationDeniedFilter`, `DependencyExceptionFilter`, `ConflictExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`. Gateway may normalize transport shape; IAM owns reason/error semantics.

## Observers/listeners
Explicit handlers for model-version bump, cache invalidation, grant expiry, permission validation, tenant/resource/principal invalidation and outbox projection. No hidden edge-policy observer exists.

## Controllers
`AuthorizationController`, `RolesController`, `PermissionsController`, `PoliciesController`, `GrantsController`, `AdministrationController`, `HealthController`. Thin controller rule is mandatory.

## Gateway boundary invariants
- Gateway may prevalidate credentials but IAM remains authoritative for every authorization decision.
- Gateway never supplies a trusted final allow, role, permission, policy result or tenant authority header.
- Gateway owns public CORS and coarse edge rate limiting; IAM owns authorization-specific limits and fail-closed evaluation.
- Gateway logs transport facts; IAM logs decision/application facts.
- OTel traces continue across Gateway→IAM; IDs are stable.
- Direct/internal ingress receives the same authentication, tenant and authorization protections.
- Registry is metadata projection; IAM remains authoritative for roles, permissions, policies, grants and decisions.

## Lifecycle
Configuration/database/evaluator catalogs initialize before authorization traffic. Shutdown marks readiness false, stops checks/consumers, drains bounded work, flushes outbox/telemetry and closes dependencies. Registry/OTel outage is degradable.

## Tests
Bootstrap every role and assert DI, ordering, Gateway propagation, forged headers, no edge-final authorization, fail-closed evaluation, direct ingress, CORS/rate boundary, idempotency ownership, shutdown and Registry completeness.