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
Request ID → correlation → trusted proxy/security headers/body limit → PrincipalContext extraction → tenant context → access-log context. Webhook routes use raw-body capture before parsing where provider signature algorithms require exact bytes; raw body is never logged.

Gateway owns public CORS/WAF and coarse edge controls. Integrations retains provider/webhook/egress invariants, consumes propagated request/trace context and never replaces a valid request ID.

## Guards
`AuthenticationGuard`, `ServiceIdentityGuard`, `TenantBoundaryGuard`, `IamAuthorizationGuard`, `AssuranceGuard`, `WebhookAuthenticityGuard`, `ConnectionOwnershipGuard`. Gateway prevalidation cannot replace provider signature verification or final IAM authorization.

## Pipes
Global strict validation plus `UuidPipe`, `ProviderKeyPipe`, `ConnectionConfigPipe`, `MappingDefinitionPipe`, `SyncRequestPipe`, `ReconciliationRequestPipe`, `PaginationPipe`, `UrlPipe` with SSRF-safe normalization/allowlist policy. Gateway body limits are additional transport controls.

## Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `IdempotencyInterceptor`, `AuditContextInterceptor`, `SerializationInterceptor`, `TimeoutInterceptor`, `ProviderRequestTelemetryInterceptor`, `SensitiveFieldRedactionInterceptor`. Gateway forwards idempotency keys; Integrations owns state/dedupe.

## Filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `AuthorizationExceptionFilter`, `ProviderDependencyExceptionFilter`, `WebhookVerificationExceptionFilter`, `RateLimitExceptionFilter`, `ConflictExceptionFilter`, `UnknownExceptionFilter`. Gateway can normalize transport shape but cannot change provider/domain meaning.

## Observers/listeners
Connection state/version, credential-reference rotation, webhook normalization, sync progress, reconciliation finding, provider health/circuit, tenant lifecycle and outbox handlers. ORM hooks never call providers or emit network traffic.

## Controllers
`IntegrationsController`, `ConnectionsController`, `ConnectionAuthorizationController`, `WebhooksController`, `SyncController`, `MappingsController`, `ReconciliationController`, `ProviderStatusController`, `HealthController`.

## Gateway boundary invariants
Gateway logs transport facts; Integrations logs provider/connection/sync/reconciliation facts with redaction. OTel spans continue across Gateway→service→provider/NATS/DB/jobs. Identity authenticates; IAM authorizes; provider webhook authenticity remains Integrations-owned. Registry is metadata projection only. Direct/internal ingress remains authenticated, tenant-isolated and provider-verified.

## Lifecycle
Provider adapters validate at bootstrap; Registry/OTel are degradable. Shutdown stops pulls/schedules, drains provider requests and webhook/sync work, persists checkpoints and closes resources.

## Tests
Bootstrap every role; verify Gateway propagation, forged headers, provider signature verification, SSRF, direct ingress, IAM enforcement, CORS/rate boundary, idempotency ownership, trace continuity, graceful drain and Registry completeness.