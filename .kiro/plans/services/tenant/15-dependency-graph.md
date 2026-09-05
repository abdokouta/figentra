---
status: canonical
document: service-dependency-graph
service: tenant
version: v1
---
# Tenant Service — Dependency Graph

## Compile-time
Tenant depends on platform contracts, NestJS integration, HTTP/config/logger/observability, events/queue, database/ORM, Redis/cache, schema/security/health/Registry packages. It must not import Identity/IAM/Monetization service implementations or their ORM/repositories.

## Runtime graph
```text
Gateway -> Tenant API
Tenant -> PostgreSQL [hard]
Tenant -> Redis [degradable derived context/cache]
Tenant -> NATS JetStream [async/outbox]
Tenant -> IAM [hard for authorized tenant administration]
Tenant -> Identity contracts/API [conditional for principal validation]
Tenant -> Notifications [async]
Tenant -> Audit [async]
Tenant -> DNS/resolver verification adapter [conditional external]
Tenant -> Registry [degradable]
Tenant -> OTel [degradable]
```

## Ownership boundaries
Tenant owns tenant, organization, membership, domain and tenant-settings lifecycle. IAM owns authorization semantics and role/permission/policy/grant state. Identity owns authentication/principal state. Product services own their business resource hierarchy; Tenant may carry shared context references but does not become a universal Scope service. Monetization owns commercial entitlement.

## Request-time matrix
| Dependency | Criticality | Failure |
|---|---|---|
| PostgreSQL | hard | readiness false; reject authoritative operations |
| Redis | degradable | authoritative DB/context rebuild |
| IAM | hard for protected mutations/reads | deny/dependency error |
| Identity | conditional hard | principal-target operations requiring validation fail explicitly |
| DNS verification | async/conditional | verification remains pending/retryable |
| NATS | async | outbox backlog |
| Registry/OTel | degradable | continue/retry |

## Cycle prevention
Tenant does not synchronously call a product service merely to establish tenant identity/context. IAM receives Tenant context by contract/event/API without circular authorization reentry. Identity principal IDs are opaque.

## Tests
Architecture tests enforce allowed imports and acyclic modules. Failure tests remove each degradable/hard dependency and verify exact behavior, including no cross-tenant cache fallback and no fabricated membership/domain state.