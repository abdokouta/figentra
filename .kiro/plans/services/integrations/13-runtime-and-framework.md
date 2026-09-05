---
status: canonical
document: service-runtime-framework
service: integrations
version: v1
runtime: nestjs
---
# Integrations Service — Runtime and NestJS Framework Contract

Single NestJS source tree exposes `api`, `consumer`, `worker`, `scheduler`.

## Modules
`AppModule`, `RuntimeModule`, `ConfigModule`, `DatabaseModule`, `MessagingModule`, `IntegrationsCatalogModule`, `ConnectionsModule`, `CredentialsModule`, `WebhooksModule`, `SyncModule`, `MappingsModule`, `ReconciliationModule`, `ProviderModule`, `SecurityModule`, `RegistryModule`, `ObservabilityModule`, `HealthModule`.

## Middleware
Request ID → correlation → trusted proxy/security headers/body limit → PrincipalContext extraction → tenant context → access-log context. Webhook routes use raw-body capture middleware before parsing where provider signature algorithms require exact bytes; raw body is never logged.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard`, `TenantBoundaryGuard`, `IamAuthorizationGuard`, `AssuranceGuard` for credential/provider admin changes, `WebhookAuthenticityGuard` using provider-specific verified adapter, `ConnectionOwnershipGuard`.

## Pipes
Global strict validation plus `UuidPipe`, `ProviderKeyPipe`, `ConnectionConfigPipe`, `MappingDefinitionPipe`, `SyncRequestPipe`, `ReconciliationRequestPipe`, `PaginationPipe`, `UrlPipe` with SSRF-safe normalization/allowlist policy.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`, `ProviderRequestTelemetryInterceptor`, `SensitiveFieldRedactionInterceptor`.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationExceptionFilter`, `ProviderDependencyExceptionFilter`, `WebhookVerificationExceptionFilter`, `RateLimitExceptionFilter`, `ConflictExceptionFilter`, `UnknownExceptionFilter`.

## Observers/listeners
Connection state/version observer, credential-reference rotation handler, webhook normalization handler, sync progress/result projector, reconciliation finding handler, provider health/circuit state observer, tenant lifecycle disable handler, outbox publisher. ORM hooks never call providers or emit network traffic.

## Controllers
`IntegrationsController`, `ConnectionsController`, `ConnectionAuthorizationController`, `WebhooksController`, `SyncController`, `MappingsController`, `ReconciliationController`, `ProviderStatusController` (authorized), `HealthController`.

## Lifecycle
Provider adapters are registered/validated at bootstrap. Only active-role dependencies initialize. Registry/OTel are degradable. Shutdown marks readiness false, stops scheduler/consumer pulls, drains provider requests and in-flight webhook/sync work to configured deadline, persists checkpoints/state, flushes outbox/telemetry and closes resources.

## Tests
Bootstrap every role, verify raw-body middleware ordering, auth/tenant/SSRF guards, provider adapter registration, interceptor/filter order, no credential logging, graceful provider-call cancellation/drain and complete Registry discovery.