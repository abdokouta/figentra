---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: audit
version: v1
runtime: nestjs
anchor_adrs: [ADR-0024]
---
# Audit Service — implementation plan

## Mission and boundary
Audit owns durable, append-oriented records of security, authorization, administration and compliance-relevant actions. It is not application logging, OpenTelemetry, analytics, tracking, policy evaluation or notification delivery. Audit records are immutable after append; corrections are additive records.

## Source tree
```text
services/audit/src/
├── modules/{records,queries,exports,integrity,retention,archive}
├── application/{commands,queries,services}
├── domain/{audit-record,hash-chain,retention-policy}
├── infrastructure/{database,messaging,object-storage,config}
├── presentation/{http,openapi}
├── database/{entities,migrations}
├── workers/{ingestion,exports,integrity,retention}
└── main.ts
```

## Models
`AuditRecord(id,tenantId,eventId,eventType,action,actorPrincipalId,subjectPrincipalId,resourceType,resourceId,requestId,correlationId,causationId,occurredAt,recordedAt,result,reasonCode,metadataHash,previousHash,recordHash,schemaVersion)`
`AuditExport(id,tenantId,range,status,objectRef,checksum,requestedBy,createdAt,expiresAt)`
`RetentionPolicy(id,tenantId,eventType,retentionDays,archiveClass,effectiveAt,version)`
`IntegrityCheck(id,tenantId,startAt,endAt,status,verifiedCount,failureCount,completedAt)`

## Public API
```ts
interface AuditService {
  append(input:AppendAuditInput):Promise<AuditRecordView>;
  query(ctx:RequestContext,input:AuditQuery):Promise<Paginated<AuditRecordView>>;
  get(ctx:RequestContext,id:string):Promise<AuditRecordView>;
  export(ctx:RequestContext,input:AuditExportInput):Promise<AuditExportView>;
  verify(ctx:RequestContext,input:IntegrityCheckInput):Promise<IntegrityCheckView>;
}
```
DTOs: `AppendAuditRecordDto`, `AuditQueryDto`, `AuditExportDto`, `IntegrityCheckDto`, `RetentionPolicyDto`.

## Controllers
```text
GET    /v1/audit
GET    /v1/audit/:id
POST   /v1/audit/exports
GET    /v1/audit/exports/:id
POST   /v1/audit/integrity-checks
GET    /v1/audit/retention
PUT    /v1/audit/retention
```

Query/export/admin operations require Identity context + IAM permission. Producers authenticate as service identities when publishing audit commands/events.

## Ingestion semantics
Producers emit audit contracts after successful business transactions through transactional outbox. Audit consumes at least once and deduplicates stable event IDs. Append is durable before acknowledgement. Ordering is per tenant/event stream where a producer supplies sequence information; global ordering is not promised.

## Integrity
Canonical serialization is hashed with a chained `previousHash`. `recordHash = H(schemaVersion || canonicalRecord || previousHash)`. Integrity checks detect missing/changed records and report gaps. Hashing supplements, but does not replace, database/object-storage access controls and archive immutability.

## Persistence
PostgreSQL tables `audit_records`, `audit_exports`, `retention_policies`, `integrity_checks`, `outbox`. Append-only partitioning may be used for scale. Index tenant/time, actor, subject, resource, action, event ID and correlation ID. Exports use Files/object storage and checksums.

## Retention/archive
Retention policy is tenant/event-type specific where legally allowed. A scheduler creates bounded archive/delete batches. Destructive deletion requires explicit policy and produces an immutable deletion evidence record. Legal hold metadata blocks deletion/archive compaction.

## Reliability
Ingestion retries are bounded. Poison audit messages go to DLQ without blocking other tenants. Export/check runs are resumable using checkpoints. Query remains available while ingestion is lagging. Database/object-storage outages surface dependency errors and do not acknowledge unpersisted audit records.

## Security/tenancy
Audit rows are tenant-isolated and append authorization is scoped to trusted service identities. Query/export fields are IAM-protected and date/range limited. Sensitive metadata is classified/encrypted and never printed to operational logs/traces.

## Runtime roles
`api` for query/export/admin APIs; `consumer` for audit-event ingestion; `worker` for exports/integrity/archive; `scheduler` for retention/legal-hold evaluation. One NestJS service tree only.

## Observability
Metrics: ingestion lag, duplicate rate, append failures, query latency, export progress, integrity failures and retention backlog. OTel traces identify tenant/request/correlation IDs without raw records. Infrastructure owns dashboards/alerts.

## Testing
Immutable append behavior; duplicate event ingestion; hash-chain verification/gap detection; tenant isolation; IAM enforcement; pagination/filtering; export authorization/checksum; retention/legal hold; concurrent appends; migration compatibility; outage/retry/DLQ recovery.

## Implementation phases
1. Contracts/scaffold/database.
2. Append model/outbox consumer.
3. Query/filter/pagination API.
4. Export/archive/integrity worker infrastructure.
5. Retention/legal hold.
6. Security, observability, load and failure verification.

## Exit criteria
- Every audited producer uses canonical Audit contracts.
- Records are immutable and verifiable.
- Query/export are tenant-isolated and IAM-protected.
- Retention and archive are policy-driven and resumable.
- Audit is not used as a logging or analytics database.
