---
status: canonical
component: service
service: audit
version: v1
runtime: nestjs
---
# Audit Service — implementation-complete plan

## Mission
Provide immutable, tenant-isolated records of security, authorization, administration and compliance-relevant actions. Audit is not application logging, OpenTelemetry, analytics, tracking, policy evaluation or notification delivery.

## Models
`AuditRecord(id,tenantId,eventType,action,actorPrincipalId,subjectPrincipalId,resourceType,resourceId,requestId,correlationId,causationId,occurredAt,recordedAt,result,reasonCode,metadataHash,previousHash,recordHash,schemaVersion)`; `AuditExport(id,tenantId,range,status,objectRef,checksum,requestedBy)`; `RetentionPolicy(id,tenantId,eventType,retentionDays,archiveClass)`; `IntegrityCheck(id,tenantId,startAt,endAt,status,verifiedCount,failureCount)`.

## DTOs/interfaces
`AppendAuditRecordDto`, `AuditQueryDto`, `AuditRecordDto`, `AuditExportDto`, `IntegrityCheckDto`, `RetentionPolicyDto`.
```ts
interface AuditService { append(ctx,input):Promise<AuditRecord>; query(ctx,input):Promise<Page<AuditRecord>>; export(ctx,input):Promise<AuditExport>; verify(ctx,input):Promise<IntegrityCheck> }
```

## API
`GET /v1/audit`; `GET /v1/audit/:id`; `POST /v1/audit/exports`; `GET /v1/audit/exports/:id`; `POST /v1/audit/integrity-checks`; `GET/PUT /v1/audit/retention`.

## Ingestion
Security-significant services publish audit commands/events transactionally through their outbox. Audit ingestion is at-least-once and deduplicated by source event ID. Append succeeds only after durable persistence. Records are immutable after append; corrections are represented by new records, never mutation.

## IAM/Identity/Tenant
Identity supplies actor/subject principal identifiers and authentication/delegation context. IAM authorizes querying/exporting/audit administration. Tenant is the isolation authority. Audit does not make authorization decisions; it records their results where required.

## Integrity
Records may form a per-tenant hash chain: `recordHash = H(version || canonicalRecord || previousHash)`. Verification detects tampering or gaps. Hashing proves record continuity but does not replace database access controls or archival immutability.

## Persistence
PostgreSQL partitioned `audit_records`, `audit_exports`, `retention_policies`, `integrity_checks`, `outbox`. Index tenant/time, actor, subject, resource, action, correlation and event ID. Archive exports use Files/object storage with checksum and access control.

## Workers/scheduler
Consumer appends records; worker performs exports, integrity checks and archive transitions; scheduler executes retention after legal/configured windows. Deletion is forbidden unless retention policy explicitly permits it and produces evidence.

## Security
Append credentials are service identities with narrow permissions. Query/export is IAM-protected. Restricted metadata is encrypted/classified. Audit payloads are excluded from normal logs and traces.

## Observability
Ingestion lag, append failure, duplicate rate, query latency, export progress, integrity failures and retention backlog. Never log raw audit records.

## Testing
Immutable semantics, hash-chain verification, duplicate ingestion, tenant isolation, IAM enforcement, pagination, export authorization, retention boundaries, archive integrity, migration compatibility and concurrent append ordering.

## Completion gate
Every required audit action has a canonical event contract and producer owner; records are immutable, queryable, integrity-verifiable and tenant-isolated; no generic log table is used as Audit.