---
status: canonical
document: service-dependency-graph
service: identity
version: v1
---
# Identity Service — Dependency Graph

## 1. Dependency classes
Dependencies are classified as compile-time, request-time hard, request-time degradable, asynchronous, infrastructure, or external provider. Every dependency must have an owner, timeout, failure policy and test.

## 2. Compile-time packages
Required platform dependencies include `@stackra/contracts`, `@stackra/nestjs`, `@stackra/http`, `@stackra/config`, `@stackra/logger`, `@stackra/observability`, `@stackra/events`, `@stackra/queue`, `@stackra/health`, `@stackra/security`, `@stackra/schema`, `@stackra/database`/ORM integration, cache/Redis integration, registry integration and testing utilities. Identity may depend on provider SDKs only from its infrastructure provider adapter.

Forbidden compile-time dependencies: IAM implementation, Tenant implementation, Monetization implementation, other services' ORM entities/repositories, Clerk packages, generic Integrations provider implementations for authentication, application-specific domain modules.

## 3. Service graph

```text
Gateway
  -> Identity API

Identity
  -> Supabase Auth                  [external provider, hard for provider mutation]
  -> PostgreSQL                     [hard]
  -> Redis                          [degradable for eligible caches; hard only where replay/rate semantics require]
  -> NATS JetStream                 [async; writes protected by outbox]
  -> IAM API                        [hard for privileged administrative authorization]
  -> Tenant API/contracts           [hard only for operations requiring authoritative tenant validation]
  -> Notifications                  [async request]
  -> Audit                          [async evidence events]
  -> Application Registry           [degradable/non-blocking]
  -> OTel collector                 [degradable]
```

## 4. Dependency rules
- Identity is authoritative for principal/authentication state; no downstream service writes Identity tables.
- IAM consumes principal context but never becomes an authentication provider.
- Tenant references principal IDs opaquely; Identity does not own membership/tenant lifecycle.
- Notifications receives notification requests asynchronously.
- Audit receives durable security/governance facts asynchronously.
- Registry stores metadata projections only.
- Supabase identities map to internal Principal/Identity records; provider identifiers never replace canonical principal IDs.

## 5. Cycle prevention
No synchronous cycle is permitted. In particular `Identity -> IAM -> Identity` must not occur during a single authorization decision. IAM receives a previously established trusted principal context; it must not synchronously call Identity to authenticate it again. Tenant/Identity synchronization is event-driven where possible.

## 6. Runtime dependency matrix

| Dependency | Startup | Request path | Failure policy |
|---|---|---|---|
| PostgreSQL | required | required | readiness false; no fabricated state |
| Supabase/JWKS | required configuration; network may warm lazily | authentication/provider operations | fail closed for unverifiable auth |
| Redis | preferred | cache/rate/replay depending use | bypass cache where safe; never bypass security invariant |
| NATS | not required for HTTP bind if outbox can accumulate | async publication/consumption | outbox backlog; consumer role degraded |
| IAM | not startup-required | admin authorization | deny/dependency error; never allow |
| Tenant | not startup-required | tenant-required operations | dependency error/fail closed |
| Registry | not required | none critical | retry/degraded telemetry |
| OTel collector | not required | none critical | local buffering/drop policy |

## 7. External provider isolation
`SupabaseIdentityProvider` is the sole day-one production adapter. All provider network calls have explicit connect/request timeout, retry eligibility, circuit breaker classification and redaction. Non-idempotent mutations are never blindly retried.

## 8. Dependency tests
CI verifies dependency direction with module-boundary rules, no forbidden service implementation imports, no cycles, provider SDK isolation, failure-mode tests for every hard dependency, and startup with each degradable dependency unavailable.