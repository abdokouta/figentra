---
status: canonical
document: service-runtime-framework
service: audit
version: v1
runtime: nestjs
---
# Audit Service — Runtime and NestJS Framework Contract

Single NestJS source tree exposes `api`, `consumer`, `worker`, `scheduler`.

## Modules
`AppModule`, `RuntimeModule`, `ConfigModule`, `DatabaseModule`, `MessagingModule`, `AuditRecordModule`, `ExportModule`, `IntegrityModule`, `RetentionModule`, `LegalHoldModule`, `ArchiveModule`, `SecurityModule`, `RegistryModule`, `ObservabilityModule`, `HealthModule`.

## Middleware
Request ID → correlation → trusted proxy/security/body-limit → PrincipalContext extraction → tenant context → access-log context. Query/export filters are never trusted as authorization boundaries.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard` for ingestion/internal endpoints, `IamAuthorizationGuard`, `TenantBoundaryGuard`, `AssuranceGuard` for legal hold/retention/integrity administration, `ExportAccessGuard` for generated artifact access.

## Pipes
Global strict validation, `UuidPipe`, `PaginationPipe`, `AuditFilterPipe`, `TimeRangePipe`, `ExportFormatPipe`, `RetentionPolicyPipe`, `LegalHoldScopePipe`. Query ranges/result sizes have explicit bounds.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `AuditQueryTelemetryInterceptor`, `IdempotencyInterceptor` for commands, `SerializationInterceptor`, `TimeoutInterceptor`, `SensitiveFieldRedactionInterceptor`. Audit does not recursively record every internal read as a new uncontrolled record; audit-of-audit actions follow explicit policy.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationExceptionFilter`, `IntegrityExceptionFilter`, `ExportExceptionFilter`, `DependencyExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`.

## Observers/listeners
Inbound event normalizer/validator, audit-chain append handler, quarantine handler, export status projector, integrity finding handler, retention/legal-hold eligibility observer, outbox publisher, archive state handler. ORM hooks cannot create chain records or network side effects implicitly.

## Controllers
`AuditQueryController`, `AuditExportController`, `IntegrityController`, `RetentionController`, `LegalHoldController`, optional approved internal ingestion/admin controller, `HealthController`.

## Lifecycle
Consumer readiness requires DB+NATS+chain metadata. API readiness requires DB; object storage is required for export operations but may be conditional. Shutdown stops new queries/jobs/consumer pulls, drains chain appends, persists checkpoints, flushes outbox/telemetry and closes resources.

## Tests
Bootstrap each role; assert guard/filter/pipeline order, query bounds, chain append transaction behavior, consumer drain, no recursive/unbounded audit generation and complete Registry discovery.