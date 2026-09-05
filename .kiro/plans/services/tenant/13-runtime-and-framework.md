---
status: canonical
document: service-runtime-framework
service: tenant
version: v1
runtime: nestjs
---
# Tenant Service — Runtime and NestJS Framework Contract

Single NestJS source tree exposes `api`, `consumer`, `worker`, `scheduler`.

## Modules
`AppModule`, `RuntimeModule`, `ConfigModule`, `DatabaseModule`, `MessagingModule`, `TenantModule`, `OrganizationModule`, `MembershipModule`, `DomainModule`, `SettingsModule`, `ContextModule`, `SecurityModule`, `RegistryModule`, `ObservabilityModule`, `HealthModule`.

## Middleware
Order: request ID → correlation → trusted proxy/security headers/body limit → PrincipalContext extraction → tenant route/context extraction → access-log context. A client-provided tenant header is a requested context only and must be validated against route/body and IAM.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard`, `TenantBoundaryGuard`, `IamAuthorizationGuard`, `TenantLifecycleGuard`, `AssuranceGuard` for privileged tenant/domain/settings mutations.

## Pipes
Global strict validation plus `UuidPipe`, `TenantSlugPipe`, `DomainNamePipe`, `MembershipRoleInputPipe` (role references only; role semantics remain IAM), `SettingsPatchPipe`, `PaginationPipe`, `LocalePipe`.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `TenantContextVersionInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `TenantStateExceptionFilter`, `AuthorizationExceptionFilter`, `ConflictExceptionFilter`, `DependencyExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`.

## Observers/listeners
Explicit handlers: lifecycle version bump, membership context invalidation, domain verification state projection, settings revision, outbox projection, cache invalidation, Identity principal lifecycle reconciliation. ORM hooks cannot publish messages, call IAM/Identity, or mutate another aggregate.

## Controllers
`TenantsController`, `OrganizationsController`, `MembershipsController`, `DomainsController`, `TenantSettingsController`, `TenantContextController` (internal/approved), `HealthController`.

## Lifecycle
Startup validates config/schema/DB and module catalogs before readiness. Registry/OTel are degradable. Shutdown marks readiness false, stops scheduler acquisition and consumer pulls, drains in-flight HTTP/messages/jobs, flushes outbox/telemetry and closes NATS/Redis/PostgreSQL.

## Tests
Bootstrap each role independently; verify DI graph, framework ordering, lifecycle guards, tenant-context anti-forgery, no hidden side effects, graceful shutdown and Registry discovery completeness.