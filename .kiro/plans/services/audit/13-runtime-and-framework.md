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

Gateway owns public CORS/WAF and coarse edge controls. Audit retains service-side trust, bounds and evidence integrity. It consumes propagated request/trace context and never replaces a valid request ID.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard`, `IamAuthorizationGuard`, `TenantBoundaryGuard`, `AssuranceGuard`, `ExportAccessGuard`. Gateway prevalidation is not final authorization or evidence provenance.

## Pipes
Global strict validation, `UuidPipe`, `PaginationPipe`, `AuditFilterPipe`, `TimeRangePipe`, `ExportFormatPipe`, `RetentionPolicyPipe`, `LegalHoldScopePipe`. Query ranges/result sizes have explicit bounds independent of Gateway transport limits.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `AuditQueryTelemetryInterceptor`, `IdempotencyInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`, `SensitiveFieldRedactionInterceptor`. Audit does not recursively create uncontrolled records.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationExceptionFilter`, `IntegrityExceptionFilter`, `ExportExceptionFilter`, `DependencyExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`. Audit owns evidence semantics; Gateway may only normalize transport shape.

## Observers/listeners
Inbound event normalizer/validator, chain append, quarantine, export status, integrity finding, retention/legal-hold eligibility, outbox and archive handlers. No listener implements edge policy.

## Controllers
`AuditQueryController`, `AuditExportController`, `IntegrityController`, `RetentionController`, `LegalHoldController`, approved internal ingestion/admin controller, `HealthController`.

## Gateway boundary invariants
Gateway logs transport facts; Audit logs operational/application facts without restricted payloads. OTel spans continue across Gateway→Audit, NATS, DB and jobs. Identity authenticates; IAM authorizes; Audit independently validates producer envelopes and tenant scope. Registry is projection only. Direct/internal ingress remains authenticated, tenant-isolated and schema-validated.

## Lifecycle
Consumer readiness requires DB+NATS+chain metadata. API readiness requires DB. Registry/OTel are degradable. Shutdown drains queries/chain appends/jobs, persists checkpoints and closes resources.

## Tests
Bootstrap every role; assert Gateway propagation, forged provenance/tenant headers, authoritative IAM, direct ingress, CORS/rate boundary, idempotency ownership, chain integrity, no recursive audit generation, graceful shutdown and Registry completeness.