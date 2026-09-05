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
Required composition: `AppModule`, `RuntimeModule`, `ConfigModule`, `DatabaseModule`, `MessagingModule`, `IdentityModule`, `ProviderModule`, `SecurityModule`, `RegistryModule`, `ObservabilityModule`, `HealthModule`.

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

Gateway owns public edge CORS, WAF and coarse edge traffic controls. Identity MUST NOT replace a valid Gateway request ID or create a competing edge policy. Service middleware remains mandatory for direct/internal ingress and for authentication invariants.

## 4. Guards
- `AuthenticationGuard` verifies credentials and establishes trusted `PrincipalContext`.
- `ServiceIdentityGuard` validates machine-to-machine credentials.
- `IamAuthorizationGuard` invokes IAM for administrative/domain actions.
- `AssuranceGuard` enforces MFA/assurance requirements for sensitive operations.
- `DelegationGuard` validates delegation validity and preserves actor/effective-subject attribution.

Gateway prevalidation is never final authentication or authorization. No controller duplicates authorization logic inline.

## 5. Pipes
Global strict `ValidationPipe`; `UuidPipe`; `PaginationPipe`; `ProviderIdentifierPipe`; `LocalePipe`. Validation failures map to stable problem/error contracts. Gateway transport limits do not replace DTO/domain validation.

## 6. Interceptors
`RequestContextInterceptor`, `TracingInterceptor`, `MetricsInterceptor`, `AuditContextInterceptor`, `IdempotencyInterceptor` on required mutations, `SerializationInterceptor`, `TimeoutInterceptor`, `SensitiveFieldRedactionInterceptor`. Request/trace context consumes Gateway propagation. Gateway does not own Identity idempotency state.

## 7. Exception filters
`DomainExceptionFilter`, `ValidationExceptionFilter`, `ProviderDependencyExceptionFilter`, `AuthorizationExceptionFilter`, `RateLimitExceptionFilter`, `UnknownExceptionFilter`. Filters own Identity semantics; Gateway may normalize transport shape but cannot rewrite domain meaning.

## 8. Observers/listeners
Identity uses explicit domain-event handlers rather than hidden ORM side effects. Registry metadata discovery is projection only. No listener performs public-edge policy decisions.

## 9. Controllers
Controllers are thin adapters: `AuthController`, `MeController`, `SessionsController`, `IdentitiesController`, `ServiceIdentitiesController`, `DelegationsController`, `ProviderWebhooksController`, health/metadata endpoints. Controllers validate/authorize/map and delegate.

## 10. Graceful lifecycle
On SIGTERM/SIGINT: stop accepting HTTP, mark readiness false, stop scheduler acquisition, stop pulling messages, drain bounded in-flight work, flush outbox/telemetry, close dependencies, then exit.

## 11. Gateway boundary invariants
- Gateway owns public CORS, edge WAF/rate limiting, route resolution, transport normalization and propagation.
- Identity owns authoritative authentication, sessions, provider semantics, replay, principal resolution and delegation.
- IAM owns authorization; Gateway cannot manufacture an allow.
- Identity revalidates forwarded-header trust and never trusts client identity/tenant/actor/assurance headers.
- Gateway logs transport facts; Identity logs authentication/application facts.
- OTel traces continue across the boundary; request/correlation IDs remain stable.
- Direct/internal ingress is treated as untrusted until service authentication succeeds.

## 12. Framework test gate
Bootstrap every role; verify DI graph, middleware/guard/interceptor/filter order, Gateway context propagation, invalid/forged headers, direct ingress, no duplicate public CORS/rate authority, authoritative authentication after Gateway prevalidation, IAM calls, idempotency ownership, shutdown hooks and Registry discovery output.