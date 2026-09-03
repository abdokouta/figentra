# Analytics Service — Complete Implementation Specification

**Status:** Canonical / production day-one target  
**Runtime:** Node.js 22 + NestJS; API, NATS consumer, worker and scheduler roles  
**Persistence:** PostgreSQL via MikroORM  
**Transport:** HTTPS/OpenAPI + NATS JetStream  
**Contract owner:** `@stackra/contracts`

## 1. Mission and ownership

Analytics answers **what happened statistically**. It owns durable analytical ingestion, event normalization, deduplication, facts, dimensions, measures, aggregations, attribution read models and analytical queries.

It MUST NOT own campaign decisions, message delivery, behavioral collection SDKs, operational telemetry, immutable audit records, or source business entities.

### Owns

- AnalyticsEvent / EventEnvelope ingestion record
- EventDeduplication record
- EventFact
- DimensionSnapshot
- MetricDefinition
- MetricMaterialization
- AttributionModel
- AttributionTouch
- AggregateBucket
- QueryDefinition
- QueryRun
- AnalyticsExport
- BackfillJob

### Consumes

- `@stackra/contracts` versioned tracking/event contracts
- domain events from product services
- tenant/scope context from Tenant/Scope
- authorization decisions from IAM/Policy
- usage records where analytical usage must be correlated

### Calls

- **Identity:** only when identity enrichment is required; authenticate caller and resolve principal references. Never copy identity provider state.
- **Tenant:** resolve tenant status/configuration and residency.
- **Scope:** validate requested scope and hierarchy.
- **IAM/Policy:** authorize analytical access.
- **Audit:** record security-sensitive exports/configuration changes.
- **Files:** store generated exports.

Analytics never calls Marketing to decide what an event means. Marketing consumes analytical facts/read APIs.

## 2. Architecture

```text
Tracking SDK / Domain Events
        ↓
NATS / ingestion endpoint
        ↓
Analytics Ingestion Worker
        ↓
normalize → validate → dedupe
        ↓
facts + dimensions + attribution
        ↓
aggregate/materialize
        ↓
PostgreSQL analytical store
        ↓
Analytics API / Reporting / Marketing
```

The ingestion path is asynchronous and at-least-once. Every event has an immutable event ID and producer identity. Duplicate delivery MUST produce one logical fact.

## 3. Source tree

```text
services/analytics/
└── src/
    ├── analytics/
    │   ├── domain/
    │   │   ├── entities/
    │   │   ├── value-objects/
    │   │   ├── policies/
    │   │   └── events/
    │   ├── application/
    │   │   ├── commands/
    │   │   ├── queries/
    │   │   ├── services/
    │   │   └── ports/
    │   ├── infrastructure/
    │   │   ├── persistence/
    │   │   ├── messaging/
    │   │   ├── attribution/
    │   │   └── exports/
    │   ├── presentation/
    │   │   ├── controllers/
    │   │   └── dto/
    │   ├── consumers/
    │   ├── workers/
    │   └── analytics.module.ts
    ├── database/migrations/
    ├── app.module.ts
    └── main.ts
```

## 4. Domain models

### AnalyticsEvent

```ts
interface AnalyticsEvent {
  id: string;
  tenantId: string;
  eventId: string;
  eventName: string;
  eventVersion: number;
  occurredAt: string;
  receivedAt: string;
  source: 'tracking' | 'domain' | 'integration' | 'system';
  principalId?: string;
  anonymousId?: string;
  sessionId?: string;
  scopeId?: string;
  applicationId?: string;
  properties: Record<string, unknown>;
  context: AnalyticsContext;
}
```

### AnalyticsContext

```ts
interface AnalyticsContext {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  sourceUrl?: string;
  referrer?: string;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  device?: Record<string, string>;
  attribution?: AttributionContext;
}
```

### Fact / Dimension / Metric

```ts
interface EventFact { id: string; tenantId: string; eventId: string; metricValues: Record<string, number>; dimensions: Record<string,string>; occurredAt: string; }
interface DimensionSnapshot { id: string; tenantId: string; dimension: string; entityId: string; validFrom: string; validTo?: string; attributes: Record<string,unknown>; }
interface MetricDefinition { id: string; tenantId?: string; key: string; name: string; expression: string; unit: string; aggregation: 'sum'|'count'|'avg'|'min'|'max'|'distinct_count'; }
```

### Attribution

```ts
interface AttributionModel { id: string; tenantId: string; key: string; windowSeconds: number; algorithm: 'first_touch'|'last_touch'|'linear'|'time_decay'|'position_based'; }
interface AttributionTouch { id: string; tenantId: string; eventId: string; sessionId?: string; channel?: string; campaignId?: string; occurredAt: string; credit: number; }
```

## 5. DTOs

### IngestAnalyticsEventDto

```ts
interface IngestAnalyticsEventDto {
  eventId: string;
  eventName: string;
  eventVersion: number;
  occurredAt: string;
  source: 'tracking'|'domain'|'integration'|'system';
  anonymousId?: string;
  sessionId?: string;
  scopeId?: string;
  applicationId?: string;
  properties?: Record<string, unknown>;
  context?: AnalyticsContext;
}
```

### QueryAnalyticsDto

```ts
interface QueryAnalyticsDto {
  metric: string;
  dimensions?: string[];
  filters?: AnalyticsFilter[];
  from: string;
  to: string;
  interval?: 'hour'|'day'|'week'|'month';
  attributionModel?: string;
  cursor?: string;
  limit?: number;
}
```

### ExportAnalyticsDto

```ts
interface ExportAnalyticsDto extends QueryAnalyticsDto {
  format: 'csv'|'json'|'parquet';
  destination: 'file';
}
```

## 6. Application interfaces and methods

```ts
interface AnalyticsIngestionService {
  ingest(input: IngestAnalyticsEventDto, context: RequestContext): Promise<IngestionResult>;
  ingestBatch(input: IngestAnalyticsEventDto[], context: RequestContext): Promise<BatchIngestionResult>;
  deduplicate(eventId: string, tenantId: string): Promise<boolean>;
}

interface AnalyticsQueryService {
  query(input: QueryAnalyticsDto, context: RequestContext): Promise<AnalyticsQueryResult>;
  getMetric(metric: string, context: RequestContext): Promise<MetricDefinitionDto>;
  listMetrics(context: RequestContext): Promise<MetricDefinitionDto[]>;
}

interface AttributionService {
  calculate(modelId: string, subjectId: string, range: DateRange, context: RequestContext): Promise<AttributionResult>;
  rebuild(modelId: string, range: DateRange, context: RequestContext): Promise<BackfillJobDto>;
}

interface AnalyticsExportService {
  create(input: ExportAnalyticsDto, context: RequestContext): Promise<AnalyticsExportDto>;
  get(id: string, context: RequestContext): Promise<AnalyticsExportDto>;
  cancel(id: string, context: RequestContext): Promise<void>;
}
```

## 7. Controllers / API

### `AnalyticsController`

```text
POST   /v1/analytics/events
POST   /v1/analytics/events/batch
GET    /v1/analytics/query
GET    /v1/analytics/metrics
GET    /v1/analytics/metrics/:key
POST   /v1/analytics/exports
GET    /v1/analytics/exports/:id
POST   /v1/analytics/exports/:id/cancel
```

### `AnalyticsAdminController`

```text
POST   /v1/analytics/metrics
PATCH  /v1/analytics/metrics/:id
DELETE /v1/analytics/metrics/:id
POST   /v1/analytics/backfills
GET    /v1/analytics/backfills/:id
POST   /v1/analytics/attribution/rebuild
```

All mutating operations require an idempotency key. Tenant ID is derived from trusted context, never accepted as an unrestricted client filter.

## 8. Worker roles

### IngestionWorker

Consumes `tracking.*.v1` and relevant domain events. Pipeline:

```text
receive → validate → authorize producer → dedupe → normalize → persist → acknowledge
```

### AggregationWorker

```text
facts → bucket windows → compute measures → upsert materializations
```

### BackfillWorker

```text
job → bounded partitions → checkpoint → process → reconcile → complete
```

### Scheduler

Triggers scheduled materialization, retention, reconciliation and backfills. It MUST use durable job records, not in-memory timers as the source of truth.

## 9. Persistence

Tables:

```text
analytics_event
analytics_event_deduplication
analytics_fact
analytics_dimension_snapshot
analytics_metric_definition
analytics_metric_materialization
analytics_attribution_model
analytics_attribution_touch
analytics_aggregate_bucket
analytics_query_definition
analytics_query_run
analytics_export
analytics_backfill_job
```

Required indexes:

```text
(tenant_id, occurred_at)
(tenant_id, event_name, occurred_at)
(tenant_id, session_id, occurred_at)
(tenant_id, principal_id, occurred_at)
unique(tenant_id, event_id)
```

Raw event properties are JSONB and must have bounded size. Frequently queried dimensions are promoted to typed columns/materialized projections.

## 10. Relations

```text
Tracking → Analytics
Domain Events → Analytics
Tenant → Analytics
Scope → Analytics
IAM/Policy → Analytics access
Analytics → Reporting
Analytics → Marketing
Analytics → Files (exports)
Analytics → Audit (configuration/export audit)
```

Marketing MUST consume analytics contracts rather than read analytics tables directly.

## 11. Security / privacy

- IAM authorization on every query/export/configuration operation.
- Tenant isolation at application and PostgreSQL/RLS layers.
- Sensitive properties use explicit allowlists; no arbitrary credential/token collection.
- PII classification is attached to schemas and enforced before persistence/export.
- Subject deletion/anonymization propagates through the defined privacy workflow.
- Export URLs are short-lived and access-controlled.

## 12. Reliability

- at-least-once ingestion
- idempotent event IDs
- durable consumer acknowledgements
- retry with bounded exponential backoff
- poison-message DLQ
- checkpointed backfills
- reconciliation between received, persisted and aggregated counts
- no data loss when downstream analytics query service is unavailable

## 13. Observability

Metrics: ingestion rate, dedupe rate, validation failures, processing lag, DLQ count, aggregation latency, query latency, export duration and backfill progress.

Tracing follows request/correlation/causation/trace context. Telemetry MUST NOT contain raw event properties or sensitive analytics payloads.

## 14. Events

Owned events:

```text
analytics.event.accepted.v1
analytics.event.rejected.v1
analytics.materialization.updated.v1
analytics.export.completed.v1
analytics.backfill.completed.v1
```

Events are emitted through the outbox where durable publication is required.

## 15. Testing

Unit: normalization, validation, dedupe, aggregation, attribution, metric expressions.  
Integration: PostgreSQL, RLS, NATS, outbox, migrations.  
Contract: event schemas, query DTOs, OpenAPI.  
E2E: ingest → query, tenant isolation, duplicate delivery, export authorization, backfill recovery.

## 16. Definition of done

The service is complete when all models, DTOs, repositories, use cases, controllers, worker handlers, migrations, contracts, security policies, telemetry, retry/DLQ behavior and tests are implemented with no placeholder provider or unresolved architecture decision.
