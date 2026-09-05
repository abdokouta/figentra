---
status: canonical
document: service-dependency-graph
service: audit
version: v1
---
# Audit Service — Dependency Graph

## Compile-time
Audit may depend on platform contracts, NestJS integration, HTTP/config/logger/observability, events/queue, database/ORM, storage, schema/security/health/Registry/testing packages. It never imports another service's ORM entities/repositories or implementation modules.

## Runtime graph
```text
All auditable services -> NATS JetStream -> Audit consumer
Audit -> PostgreSQL [hard]
Audit -> Object Storage [hard for export/archive operations]
Audit -> Redis [optional/degradable cache/locks only]
Audit -> IAM [hard for protected query/export/admin operations]
Audit -> Identity context [ingress-provided; no re-auth cycle]
Audit -> Tenant context/contracts [conditional tenant validation]
Audit -> Notifications [async]
Audit -> Registry [degradable]
Audit -> OTel [degradable]
```

## Ownership rules
Audit owns immutable governance evidence, exports, integrity checks, retention/legal-hold/archive lifecycle. It does not own application logs, traces, analytics, business authorization or source-service state. Source services remain authoritative for business entities; Audit preserves evidence of events/actions.

## Dependency matrix
| Dependency | Criticality | Failure |
|---|---|---|
| PostgreSQL | hard | ingestion/query readiness false; no evidence accepted without durable append |
| NATS | hard for consumer role | consumer not ready; upstream durable streams retain messages |
| Object Storage | conditional hard | export/archive operations fail/retry; normal query/ingestion continues if unaffected |
| IAM | hard for user/admin operations | fail closed |
| Redis | degradable | use DB/other locking path or reject operation if lock invariant cannot be maintained |
| Registry/OTel | degradable | continue/retry |

## Cycle prevention
Audit never synchronously calls a source service to decide whether an event is true. It validates the contract/envelope and records evidence. Source services do not synchronously depend on Audit success for committing business state; they publish through outbox. This prevents `Service -> Audit -> Service` cycles.

## Chain dependency
Integrity chain/canonicalization functions are pure local code. Hashing never depends on network services. Object storage archives preserve hashes/metadata required for later verification.

## Tests
Architecture/import-cycle tests and fault-injection tests cover DB/NATS/object-storage/IAM/Registry outages, proving no evidence is falsely marked committed/completed and no source business flow requires synchronous Audit availability.