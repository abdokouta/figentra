---
status: canonical
document: service-dependency-graph
service: integrations
version: v1
---
# Integrations Service — Dependency Graph

## Compile-time
Integrations may depend on platform contracts, NestJS integration, HTTP/config/logger/observability, events/queue, database/ORM, Redis/cache, schema/security/health/Registry/storage/testing packages and provider SDKs isolated inside provider adapter subtrees. It must not import Identity provider/authentication implementations, IAM/Tenant service implementations or product-service repositories.

## Runtime graph
```text
Product/business services -> Integrations API/events
Integrations -> PostgreSQL [hard]
Integrations -> Redis [degradable cache/locks/rate coordination]
Integrations -> NATS JetStream [async/outbox]
Integrations -> IAM [hard for protected admin/action paths]
Integrations -> Tenant [hard where connection tenant validation required]
Integrations -> Secret Manager [hard for provider operations requiring credentials]
Integrations -> External Business Providers [conditional hard per operation]
Integrations -> Notifications [async]
Integrations -> Audit [async]
Integrations -> Registry [degradable]
Integrations -> OTel [degradable]
```

## Provider boundary
Provider SDKs/network peculiarities terminate in infrastructure adapters. Application/domain layers see typed `IntegrationProvider` capabilities and normalized errors/results. Supabase Auth/Clerk authentication adapters are forbidden here; Identity owns authentication providers.

## Failure matrix
| Dependency | Criticality | Behavior |
|---|---|---|
| PostgreSQL | hard | readiness false for stateful operation |
| Secret Manager | hard per provider operation | operation fails; never use stale/logged secret fallback |
| Provider API | operation-specific | bounded retry/circuit/explicit degraded/failure state |
| Redis | degradable where cache | authoritative DB/provider logic; lock-sensitive operations defer if invariant not safe |
| NATS | async | outbox backlog/consumer degradation |
| IAM/Tenant | hard for relevant admin/context | fail closed/dependency error |
| Registry/OTel | degradable | continue/retry |

## Cycle prevention
Business services must not synchronously call Integrations, which synchronously calls the same business service back. Sync imports provider data into normalized integration results/events; consuming business service applies domain mutation independently. Webhooks follow provider -> Integrations -> durable normalized event -> business consumer.

## Tests
Architecture rules enforce adapter isolation, no provider SDK outside infrastructure, no auth-provider packages, no service implementation imports/cycles, and declared behavior with DB/Redis/NATS/secret manager/provider/IAM/Tenant/Registry failures.