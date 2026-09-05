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

## Guards
- `AuthenticationGuard` requires trusted Identity-issued/authenticated context.
- `IamAdministrationGuard` protects IAM administration routes through bootstrap-safe administrative permissions.
- `TenantBoundaryGuard` validates tenant scope.
- `AssuranceGuard` enforces stronger authentication for privileged grant/policy operations.
- `ServiceIdentityGuard` protects service-to-service authorization API.

The authorization check endpoint must avoid recursive self-authorization: service authentication and predefined bootstrap/admin policy guard the control plane; the evaluator itself is not recursively invoked to authorize the same evaluation.

## Pipes
Global strict validation plus `UuidPipe`, `PermissionKeyPipe`, `ActionKeyPipe`, `ResourceIdentifierPipe`, `PolicyAstPipe`, `PaginationPipe`. Policy AST validation rejects unknown operators/fields, excessive depth/size and any executable/network/filesystem construct.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`, `AuthorizationDecisionTelemetryInterceptor`. No interceptor may convert evaluation failure into allow.

## Exception filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationDeniedFilter`, `DependencyExceptionFilter`, `ConflictExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`. Errors expose stable reason/error codes without policy secrets or stack traces.

## Observers/listeners
Explicit handlers: model-version bump, cache invalidation, grant-expiry projection, permission catalog bootstrap validation, tenant/resource invalidation, principal/delegation invalidation, outbox projection. ORM callbacks must not publish messages or perform network authorization.

## Controllers
`AuthorizationController`, `RolesController`, `PermissionsController`, `PoliciesController`, `GrantsController`, `AdministrationController`, `HealthController`. Thin controller rule is mandatory.

## Lifecycle
Configuration/database/evaluator catalogs initialize before accepting authorization traffic. On shutdown: readiness false, stop new checks/consumers, drain bounded in-flight evaluations and messages, flush outbox/telemetry, close dependencies. Startup fails on invalid permission/policy schema or database; Registry/OTel outage is degradable.

## Tests
DI/bootstrap tests run each runtime role, assert middleware/guard/interceptor/filter ordering, no recursive auth, AST limits, shutdown drain and discovered Registry artifacts.