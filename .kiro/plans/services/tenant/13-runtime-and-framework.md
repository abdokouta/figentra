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

Gateway owns public CORS/WAF, route admission and coarse edge rate limiting. Tenant retains service-side trust validation, body/domain limits and tenant-context invariants. Tenant consumes Gateway request/trace context and never replaces a valid request ID.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard`, `TenantBoundaryGuard`, `IamAuthorizationGuard`, `TenantLifecycleGuard`, `AssuranceGuard` for privileged tenant/domain/settings mutations. Gateway prevalidation cannot establish tenant authority or replace IAM.

## Pipes
Global strict validation plus `UuidPipe`, `TenantSlugPipe`, `DomainNamePipe`, `MembershipRoleInputPipe` (role references only; role semantics remain IAM), `SettingsPatchPipe`, `PaginationPipe`, `LocalePipe`. Gateway transport limits do not replace domain validation.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `TenantContextVersionInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`. Gateway forwards idempotency keys; Tenant owns state and semantics.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `TenantStateExceptionFilter`, `AuthorizationExceptionFilter`, `ConflictExceptionFilter`, `DependencyExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`. Gateway may normalize transport shape but cannot change tenant/domain semantics.

## Observers/listeners
Explicit handlers: lifecycle version bump, membership context invalidation, domain verification state projection, settings revision, outbox projection, cache invalidation, Identity principal lifecycle reconciliation. ORM hooks cannot publish messages, call IAM/Identity, mutate another aggregate or implement edge policy.

## Controllers
`TenantsController`, `OrganizationsController`, `MembershipsController`, `DomainsController`, `TenantSettingsController`, `TenantContextController` (internal/approved), `HealthController`.

## Gateway boundary invariants
Gateway owns public edge transport controls; Tenant owns tenant lifecycle/context and domain state. Identity establishes authentication; IAM authorizes tenant administration/access. Client tenant headers are never trusted merely because Gateway forwards them. Gateway logs transport facts; Tenant logs lifecycle/membership/domain application facts. OTel trace/correlation context continues across the boundary. Direct/internal ingress enforces the same authentication, tenant and IAM checks. Registry contains projections; Tenant remains authoritative for tenants, memberships, domains and settings.

## Lifecycle
Startup validates config/schema/DB and module catalogs before readiness. Registry/OTel are degradable. Shutdown marks readiness false, stops scheduler acquisition and consumer pulls, drains in-flight HTTP/messages/jobs, flushes outbox/telemetry and closes NATS/Redis/PostgreSQL.

## Tests
Bootstrap every role independently; verify DI graph, Gateway propagation, forged tenant headers, direct ingress, IAM enforcement, no duplicate public CORS/rate authority, idempotency ownership, trace continuity, graceful shutdown and Registry discovery completeness.