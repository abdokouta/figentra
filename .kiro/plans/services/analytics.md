---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: service
service: analytics
version: v1
runtime: nestjs
anchor_adrs: [ADR-0023, ADR-0024]
depends_on: ["@stackra/contracts", "@stackra/tracking", "@stackra/usage", "@stackra/database", "@stackra/observability"]
---
# Analytics Service — implementation plan

## Mission and boundary
Analytics turns behavioral/operational facts into queryable analytical facts, dimensions, metrics, funnels and attribution views. Tracking collects client-side events. Usage remains authoritative for metering. Transactional services own business truth. Marketing consumes analytical outputs but owns campaign decisions.

## Source tree
```text
services/analytics/src/
├── modules/{ingestion,event-catalog,facts,dimensions,metrics,aggregations,attribution,funnels,queries,backfills,retention,privacy}
├── application/{commands,queries,services}
├── domain/{event,fact,metric,attribution}
├── infrastructure/{database,nats,warehouse,config}
├── presentation/{http,openapi}
├── workers/{ingestion,aggregation,backfill,privacy}
├── database/{entities,migrations}
└── main.ts
```

## Models
`AnalyticsEvent(id,tenantId,eventName,eventVersion,occurredAt,receivedAt,principalId,anonymousId,sessionId,properties,context,dedupeKey,schemaVersion)`
`Fact(id,tenantId,type,entityId,timeBucket,measures,dimensions,sourceVersion)`
`Dimension(name,version,key,attributes,schemaHash)`
`MetricDefinition(id,tenantId,key,formula,window,dimensions,version,status)`
`MetricObservation(metricKey,tenantId,bucket,value,dimensions,computedAt,sourceVersion)`
`AttributionTouch(id,tenantId,subjectId,channel,campaign,occurredAt,weight,metadata)`
`BackfillJob(id,tenantId,dataset,range,status,checkpoint,version)`
`IngestionQuarantine(id,tenantId,eventHash,schemaError,receivedAt,resolutionStatus)`

## Public API
```ts
interface AnalyticsIngestionService {
  ingest(ctx:RequestContext,input:IngestEventInput):Promise<IngestResult>;
  batch(ctx:RequestContext,input:readonly IngestEventInput[]):Promise<BatchIngestResult>;
}
interface MetricService {
  query(ctx:RequestContext,input:MetricQueryInput):Promise<MetricQueryResult>;
  compute(ctx:RequestContext,input:MetricComputeInput):Promise<MetricObservation[]>;
}
interface BackfillService {
  start(ctx:RequestContext,input:BackfillInput):Promise<BackfillView>;
  status(ctx:RequestContext,id:string):Promise<BackfillView>;
  cancel(ctx:RequestContext,id:string):Promise<void>;
}
```
DTOs: `IngestEventDto`, `BatchIngestDto`, `MetricDefinitionDto`, `MetricQueryDto`, `FunnelQueryDto`, `AttributionQueryDto`, `BackfillJobDto`, `RetentionPolicyDto`.

## Controllers
```text
POST /v1/events
POST /v1/events/batch
GET  /v1/metrics
POST /v1/metrics/query
POST /v1/funnels/query
POST /v1/attribution/query
POST /v1/backfills
GET  /v1/backfills/:id
POST /v1/retention/purge
```

## Ingestion semantics
Events are accepted at least once from Tracking and service events. Schema/version validation happens before durable acceptance. Dedupe uses the producer-supplied stable key. Event time and ingestion time are stored separately. Invalid events are quarantined with hash/error metadata and never block unrelated ingestion.

Consent is evaluated according to the event's declared collection basis. Anonymous tracking identifiers are allowed only where the tracking/consent contract allows them. Deletion requests generate durable privacy jobs that locate and purge all analytical copies.

## Metric/query model
Metric definitions use a constrained expression/query AST rather than arbitrary SQL. Dimensions, filters, sort order, date ranges, cardinality and aggregation functions are allowlisted. Query cost has row/time/byte budgets. Large analytical jobs become asynchronous and return a durable query/job reference rather than exhausting the API worker.

## Attribution/funnel semantics
Attribution models are versioned. Touchpoints carry event time and channel/campaign metadata. Recomputations produce versioned results so historical model changes are explainable. Funnels define ordered steps and time windows with deterministic identity semantics for authenticated and anonymous subjects.

## Storage boundary
Production starts with partitioned PostgreSQL/materialized analytical tables where scale permits. A columnar warehouse adapter may be introduced only under an ADR. Transactional service databases are never queried directly by Analytics. Analytical copies are ingested through contracts/events.

## Identity/IAM/Tenant
Identity supplies authenticated principal context when events are authenticated. IAM authorizes metric-definition administration, sensitive analytical queries, exports and backfills. Tenant is hard isolation boundary. Queries always include tenant predicate. Cross-tenant platform analytics requires an explicit system identity/permission and dedicated aggregate contract.

## Runtime roles
`api` handles query/metric administration; `consumer` ingests Tracking/service events; `worker` aggregates facts, calculates metrics, runs backfills/privacy jobs; `scheduler` manages compaction, retention and scheduled materialization. One NestJS service tree only.

## Reliability
Ingestion consumers are idempotent. Aggregation workers use checkpoints and versioned windows. Backfills are resumable and isolated from live ingestion. Retry budgets are finite; poison batches enter quarantine/DLQ. A failed analytical aggregation does not mutate transactional source systems.

## Security/privacy
Properties and dimensions are classified. Restricted PII is excluded by default. Access to sensitive datasets requires IAM field/dataset permissions. Tokens/credentials are rejected from ingestion schemas. Tenant deletion must produce purge completion evidence. Export jobs are bounded and object-storage based for large outputs.

## Observability
Metrics: acceptance/rejection, ingest lag, dedupe rate, quarantine volume, aggregation duration, query latency/cost, backfill progress and privacy purge lag. OTel traces connect event ingestion→fact→metric computation. Raw user properties are not emitted to telemetry.

## Testing
Schema/version compatibility, duplicate ingestion, out-of-order/late event handling, aggregation determinism, metric AST security, funnel/attribution fixtures, tenant isolation, consent/deletion propagation, backfill crash/resume and query budget tests. Production-like load tests define ingest throughput and p95 analytical query latency.

## Implementation phases
1. Contracts/event catalog and analytical storage foundation.
2. Ingestion/dedupe/quarantine.
3. Facts/dimensions/metric engine.
4. Query/funnel/attribution APIs.
5. Backfill/retention/privacy workers.
6. Usage/Tracking integration and observability.
7. Security/load/failure/migration verification.

## Exit criteria
- Every analytical dataset has an owner, schema, retention and privacy class.
- Ingestion is durable, deduplicated and replayable.
- Queries are tenant-safe, bounded and authorization-aware.
- Backfills and privacy purges are checkpointed and resumable.
- No transactional service database is exposed as an analytics backend.
