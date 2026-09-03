---
status: canonical
component: service
service: analytics
version: v1
runtime: nestjs
---
# Analytics Service — implementation-complete plan

## Mission
Turn behavioral and operational facts into queryable analytical models. Tracking collects events; Analytics validates, ingests, deduplicates, models, aggregates and serves analytical queries. It does not own user authentication, transactional business state or campaign execution.

## Modules
`ingestion`, `event-catalog`, `facts`, `dimensions`, `metrics`, `aggregations`, `attribution`, `segments-read-model`, `query`, `backfill`, `retention`, `persistence`.

## Models
`AnalyticsEvent(id,tenantId,eventName,eventVersion,occurredAt,receivedAt,principalId,anonymousId,sessionId,properties,context,dedupeKey)`; `Fact(id,tenantId,type,entityId,timeBucket,measures,dimensions)`; `Dimension(name,version,key,attributes)`; `MetricDefinition(key,formula,window,version)`; `MetricObservation(metricKey,tenantId,bucket,value,dimensions,computedAt)`; `AttributionTouch(id,tenantId,subjectId,channel,campaign,occurredAt,weight)`.

## DTOs/interfaces
`IngestEventDto`, `BatchIngestDto`, `MetricQueryDto`, `FunnelQueryDto`, `AttributionQueryDto`, `BackfillJobDto`; `AnalyticsIngestionService.ingest/batch`; `MetricService.query/compute`; `AttributionService.attribute`; `BackfillService.start/status/cancel`.

## Controllers
`POST /v1/events`; `POST /v1/events/batch`; `GET /v1/metrics`; `POST /v1/metrics/query`; `POST /v1/funnels/query`; `POST /v1/attribution/query`; `POST /v1/backfills`; `GET /v1/backfills/:id`.

## Identity/IAM/Tenant
Identity supplies principal context when events are authenticated; anonymous identifiers are accepted only under the tracking consent contract. IAM authorizes administrative metric definitions, backfills and tenant data queries. Tenant is authoritative for tenant status/configuration. Analytical queries always include tenant isolation predicates.

## Ingestion semantics
Events are schema-versioned, size-bounded and deduplicated by `(tenant,eventName,eventVersion,dedupeKey)` where configured. Ingestion acknowledges only after durable acceptance. Late events use event time while ingestion time remains available for operational analysis. Invalid events go to a quarantine path with safe diagnostics.

## Persistence
Analytical storage may use PostgreSQL for the first production phase with partitioned fact tables and materialized aggregates; a columnar warehouse adapter is allowed only through an ADR. Tables include `analytics_events`, `facts`, `metric_definitions`, `metric_observations`, `attribution_touches`, `backfill_jobs`, `ingestion_quarantine`.

## Workers
NestJS consumers ingest tracking batches; workers aggregate facts, recompute affected windows and run backfills; scheduler compacts/retains partitions. Durable work is NATS/JetStream-backed with idempotent handlers.

## Security/privacy
Consent state, data classification, retention and deletion propagation are first-class. Restricted PII is excluded from default analytical properties. Tenant deletion produces a durable purge job with completion evidence. No raw tokens or credentials are accepted.

## Reliability/observability
Metrics: ingest acceptance/rejection, lag, dedupe rate, aggregation duration, query latency, backfill progress and quarantine volume. Backfills are checkpointed and resumable. Query limits prevent unbounded scans.

## Testing
Schema compatibility, duplicate events, late arrivals, aggregation determinism, attribution models, tenant isolation, consent filtering, deletion propagation, backfill restart and query performance.

## Completion gate
Tracking and Analytics have clear boundaries; every analytical dataset has owner/schema/retention; every query is tenant-safe and bounded; backfills are durable and resumable; no transactional service database is used as an analytics API.