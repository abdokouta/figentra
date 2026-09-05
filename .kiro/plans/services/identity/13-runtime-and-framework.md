---
status: canonical
document: service-runtime-framework
service: identity
version: v1
runtime: nestjs
---
# Identity Service — Runtime and NestJS Framework Contract

## 1. Runtime roles
One NestJS source tree exposes `api`, `consumer`, `worker`, and `scheduler` roles. Role selection is configuration-driven at bootstrap. A mirrored `workers/identity` application is forbidden.

## 2. Bootstrap modules
Required composition:
- `AppModule`
- `RuntimeModule`
- `ConfigModule`
- `DatabaseModule`
- `MessagingModule`
- `IdentityModule`
- `ProviderModule`
- `SecurityModule`
- `RegistryModule`
- `ObservabilityModule`
- `HealthModule`

`main.ts` validates configuration before binding sockets or starting consumers. Bootstrap order: config → telemetry → database → provider clients → messaging → registry projection → HTTP/worker role. Registry failure is non-fatal and retries asynchronously; invalid security/provider/database configuration is fatal.

## 3. Middleware order
1. `RequestIdMiddleware`
2. `CorrelationMiddleware`
3. `ForwardedHeadersValidationMiddleware`
4. `SecurityHeadersMiddleware`
5. `RequestSizeLimitMiddleware`
6. `PrincipalExtractionMiddleware`
7. `TenantContextHintMiddleware` (hint only; never trust header as authority)
8. `AccessLogContextMiddleware`

Each middleware has unit tests for ordering, malformed input and redaction.

## 4. Guards
- `AuthenticationGuard` verifies credentials and establishes trusted `PrincipalContext`.
- `ServiceIdentityGuard` validates machine-to-machine credentials.
- `IamAuthorizationGuard` invokes IAM for administrative/domain actions.
- `AssuranceGuard` enforces MFA/assurance requirements for sensitive operations.
- `DelegationGuard` validates delegation validity and preserves actor/effective-subject attribution.

No controller duplicates authorization logic inline.

## 5. Pipes
- global strict `ValidationPipe`: whitelist on, unknown fields rejected, transformation explicit.
- `UuidPipe`
- `PaginationPipe`
- `ProviderIdentifierPipe`
- `LocalePipe`

Validation failures map to stable problem/error contracts.

## 6. Interceptors
- `RequestContextInterceptor`
- `TracingInterceptor`
- `MetricsInterceptor`
- `AuditContextInterceptor`
- `IdempotencyInterceptor` on mutation endpoints requiring a key
- `SerializationInterceptor`
- `TimeoutInterceptor`
- `SensitiveFieldRedactionInterceptor` for defensive output/log context sanitation

Transaction boundaries are application/use-case owned; a broad automatic transaction interceptor must not wrap provider network calls.

## 7. Exception filters
- `DomainExceptionFilter`
- `ValidationExceptionFilter`
- `ProviderDependencyExceptionFilter`
- `AuthorizationExceptionFilter`
- `RateLimitExceptionFilter`
- `UnknownExceptionFilter`

Every filter produces the platform error envelope with request/correlation IDs and no stack traces or sensitive provider details in production.

## 8. Observers/listeners
Identity uses explicit domain-event handlers rather than hidden ORM side effects. Permitted listeners include outbox projection listeners, cache invalidation listeners, provider webhook normalization handlers, session-risk observers and registry metadata discovery. ORM entity hooks must not perform network calls, publish messages or mutate unrelated aggregates.

## 9. Controllers
Controllers are thin adapters. Required controller families: `AuthController`, `MeController`, `SessionsController`, `IdentitiesController`, `ServiceIdentitiesController`, `DelegationsController`, `ProviderWebhooksController`, and internal health/registry endpoints where platform conventions require them. Controllers validate/authorize/map and delegate to application handlers.

## 10. Graceful lifecycle
On SIGTERM/SIGINT: stop accepting HTTP, mark readiness false, stop scheduler acquisition, stop pulling new messages, drain in-flight work within configured deadline, flush outbox/telemetry, close NATS/Redis/provider clients, close PostgreSQL, then exit. Forced termination after deadline returns non-zero.

## 11. Framework test gate
Bootstrap tests instantiate every role independently, verify DI graph resolution, middleware/guard/interceptor/filter order, shutdown hooks, no accidental provider initialization in irrelevant roles, and registry discovery output.