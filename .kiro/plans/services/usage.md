---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: usage
version: v1
runtime: nestjs
anchor_adrs: [ADR-0012, ADR-0023, ADR-0024]
---
# Usage Service — implementation plan

## Mission and boundary
Usage is the authoritative metering control plane. It records consumption facts, deduplicates measurements, maintains period counters and quotas, performs deterministic aggregation/reconciliation, and exports billable usage. Analytics receives analytical copies. Monetization consumes billable usage/allowance information. Usage does not own plans, subscriptions, payment state, campaigns, or IAM policy.

## Source tree
```text
services/usage/src/
├── modules/{meters,records,counters,quotas,windows,aggregation,exports,reconciliation,retention}
├── application/{commands,queries,services}
├── domain/{entities,value-objects,calculators}
├── infrastructure/{database,messaging,cache,config}
├── presentation/{http,openapi}
├── database/{entities,migrations}
├── events/
└── main.ts
```

## Domain model
`Meter(id,tenantId,key,unit,precision,aggregation,retention,status,version)`
`UsageRecord(id,tenantId,subjectId,meterKey,quantity,unit,occurredAt,receivedAt,eventId,dedupeKey,dimensions)`
`UsageCounter(id,tenantId,subjectId,meterKey,windowStart,windowEnd,consumed,version)`
`Quota(id,tenantId,subjectId,meterKey,limit,period,startsAt,endsAt,status,version)`
`UsageExport(id,tenantId,period,status,cursor,checksum,objectRef,createdAt)`
`ReconciliationJob(id,tenantId,period,status,drift,checkpoint,startedAt,completedAt)`

Raw usage records are append-oriented and replayable. Derived counters are versioned and rebuildable. Units, precision and aggregation type are part of the meter contract and may not change silently.

## Public contracts
```ts
interface MeteringService {
  record(ctx:RequestContext,input:RecordUsageInput):Promise<RecordUsageResult>;
  recordBatch(ctx:RequestContext,input:readonly RecordUsageInput[]):Promise<BatchResult>;
  check(ctx:RequestContext,input:QuotaCheckInput):Promise<QuotaDecision>;
}
interface CounterService {
  get(ctx:RequestContext,input:CounterQuery):Promise<UsageCounterView[]>;
  consume(ctx:RequestContext,input:ConsumeUsageInput):Promise<ConsumeResult>;
}
interface ReconciliationService {
  start(ctx:RequestContext,input:ReconciliationInput):Promise<ReconciliationJobView>;
  run(jobId:string):Promise<void>;
}
```
DTOs: `CreateMeterDto`, `UpdateMeterDto`, `RecordUsageDto`, `RecordUsageBatchDto`, `UsageQueryDto`, `QuotaCheckDto`, `CreateQuotaDto`, `UsageExportDto`, `ReconciliationDto`.

## Controllers
```text
GET    /v1/meters
POST   /v1/meters
PATCH  /v1/meters/:id
POST   /v1/usage/records/batch
GET    /v1/usage
GET    /v1/usage/counters
POST   /v1/usage/check
GET    /v1/usage/exports
POST   /v1/usage/exports
GET    /v1/usage/exports/:id
POST   /v1/usage/reconciliation
GET    /v1/usage/reconciliation/:id
```

## Ingestion semantics
Transport is at-least-once. Each event must include a stable `eventId` or producer idempotency key. The service first validates tenant, meter, unit and quantity bounds, then persists the raw record and dedupe marker transactionally. A duplicate returns the original effect without another quantity increment. Unknown meters and invalid units are terminal validation errors.

Out-of-order events are accepted within configured lateness limits. Aggregation uses event time, not receive time, and late corrections are versioned. No “exactly once” claim is made at the transport layer; exactly-once **effect** is achieved through idempotent persistence and atomic counters.

## Counter/quota algorithm
Quota consumption is a transaction with row/version locking: read current counter → validate requested quantity and active quota → atomically increment if version is unchanged → commit. Concurrent oversubscription is rejected deterministically. Cache is never authoritative.

## Monetization/Analytics interactions
Monetization may request current billable usage and allowance checks. Usage does not infer a plan or commercial entitlement. Analytics consumes versioned usage events/copies and cannot mutate Usage counters. Backfills originate from Usage and are checkpointed/replayable.

## Persistence
PostgreSQL tables: `meters`, `usage_records`, `usage_counters`, `quotas`, `usage_exports`, `reconciliation_jobs`, `outbox`. Required indexes: unique `(tenant_id,event_id)`, unique idempotency key, `(tenant_id,meter_key,occurred_at)`, `(tenant_id,subject_id,meter_key,window_start)`, reconciliation checkpoint/status. Partitioning is allowed for very large append-only tables only under an explicit scale threshold/ADR.

## Retention/exports
Each meter declares retention class and legal/business retention period. Raw records are archived/deleted only according to policy; aggregates have independent retention. Exports are checksum-protected objects with signed retrieval URLs through Files/Object Storage integration and bounded date ranges.

## Reliability
Consumer concurrency and batch sizes are bounded. Failures use exponential backoff with a finite retry budget and DLQ. Poison events are quarantined. Reconciliation recomputes derived totals from raw records and reports drift instead of silently correcting financial state. Shutdown drains active DB/NATS work.

## Security/tenancy
Every record and query is tenant-scoped. Subject identifiers are opaque. Sensitive dimensions are allowlisted/tokenized. Administrative meter/quota/export APIs require Identity-authenticated principal + IAM authorization. Usage recording from internal services requires service identity and trusted tenant context.

## Runtime roles
`api` serves queries/admin/export; `consumer` ingests measurement events; `worker` aggregates, reconciles and generates exports; `scheduler` closes windows, expires quotas and launches bounded reconciliation. All roles use the same service source tree; no mirrored worker application exists.

## Observability
Metrics: records/sec, duplicate rate, consumer lag, aggregation latency, quota denials/conflicts, late-event count, export duration, reconciliation drift and DLQ depth. OTel spans propagate request/correlation/causation IDs and never contain raw usage payloads. Infrastructure owns dashboards/alerts/SLOs.

## Testing
Unit meter/unit/precision validation and aggregation functions. Integration duplicate delivery, concurrent quota consumption, out-of-order/late events, transaction rollback, outbox publication, reconciliation recovery and export checksums. Security tests for cross-tenant access and forged service context. Load/backpressure tests define p95 ingestion and query budgets.

## Implementation phases
1. Contracts, scaffold, config and migrations.
2. Meter/record ingestion and dedupe.
3. Counter/window/quota engine.
4. Queries and export generation.
5. Reconciliation/retention and worker roles.
6. Monetization/Analytics integration and outbox.
7. Failure, security, load and migration verification.

## Exit criteria
- Durable replayable usage facts.
- Duplicate delivery never double-counts.
- Counter/quota updates are concurrency-safe.
- Aggregation and reconciliation are deterministic.
- Analytics cannot mutate authoritative counters.
- Billable exports are checksum-protected and auditable.
- No duplicate metering implementation remains in another service.
