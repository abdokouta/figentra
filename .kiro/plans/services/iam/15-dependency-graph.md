---
status: canonical
document: service-dependency-graph
service: iam
version: v1
---
# IAM Service — Dependency Graph

## Compile-time
Allowed platform packages include contracts, NestJS integration, HTTP, config, logger/observability, events/queue, database/ORM, Redis/cache, schema/security/health and Registry integration. IAM never imports Identity/Tenant/Monetization implementations, ORM entities or repositories.

## Runtime graph
```text
Domain services -> IAM API
Identity context -> IAM
Tenant context/events -> IAM
IAM -> PostgreSQL [hard]
IAM -> Redis [degradable cache]
IAM -> NATS JetStream [async/outbox]
IAM -> Tenant API [only authoritative resource/tenant validation paths]
IAM -> Notifications [async]
IAM -> Audit [async]
IAM -> Registry [degradable]
IAM -> OTel [degradable]
```

Identity authenticates before IAM; IAM must not synchronously call Identity to re-authenticate, preventing `Identity -> IAM -> Identity` cycles. Principal IDs are opaque identifiers.

## Dependency policy
- PostgreSQL is authoritative for roles/policies/grants/catalog state.
- Redis contains derived decisions/versioned caches only; loss cannot lose authority.
- Tenant owns tenant lifecycle and product/service resource hierarchy metadata; IAM owns authorization semantics.
- Monetization owns commercial entitlement. If an authorization request includes entitlement facts, they are explicit signed/trusted context or queried through an approved contract, not copied billing state.
- Notifications and Audit are asynchronous outputs; IAM mutation truth does not depend on immediate delivery.
- Registry never supplies policy/grant truth.

## Request-time matrix
| Dependency | Criticality | Failure |
|---|---|---|
| PostgreSQL | hard | authorization requiring uncached authoritative state fails closed |
| Redis | degradable | authoritative evaluation; never stale allow |
| Tenant | conditional hard | required resource validation fails closed/dependency error |
| NATS | async | committed outbox accumulates |
| Registry/OTel | degradable | continue with retry/telemetry degradation |

## Cycles and package boundaries
CI enforces acyclic module graph: authorization application layer depends on ports; infrastructure implements ports; presentation depends on application contracts. Policy evaluator is pure/bounded and has no network/database/filesystem dependency during condition execution beyond pre-resolved context.

## Tests
Architecture tests scan imports, dependency-injection graph and package boundaries; resilience tests independently remove Redis/NATS/Tenant/Registry/OTel and verify declared behavior.