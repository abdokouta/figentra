---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/analytics` — product, campaign and advertising analytics

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/schema`, `@stackra/events`, `@stackra/identity`, `@stackra/storage`, `@stackra/observability`  
**Design effort:** 20 days across 10 phases

## Purpose

Own durable analytical ingestion, normalization, aggregation, attribution and analytical read models for product, campaign and advertising behavior. Analytics consumes tracking/domain facts and produces analytical facts and reports.

## Non-goals

- Operational logs, traces or metrics.
- Client tracking SDK ownership.
- Marketing campaign execution or notification delivery.
- Billable usage metering.
- Immutable audit records.
- Owning another service's business data.

## Boundary

```text
Tracking → ingestion → analytics storage → aggregation → analytical API/read models
                         ↑
                  domain/application events
```

Analytics is the authoritative owner of analytical projections, not the authoritative owner of the underlying product transaction.

## Manager pattern

`AnalyticsManager` coordinates ingestion, attribution, aggregation and provider/read-model adapters. Long-running ingestion and aggregation are asynchronous worker workloads; query/admin APIs are synchronous NestJS/control-plane workloads.

## Subpath layout

```text
packages/analytics/
├── src/core/{analytics.module.ts,manager,events,attribution,aggregation,dimensions,measures,retention,privacy,index.ts}
├── src/storage/{interfaces,postgresql,warehouse,index.ts}
├── src/nestjs/{module.ts,controllers,queries,index.ts}
├── src/worker/{ingest,aggregate,rebuild,retention,index.ts}
├── src/testing/{fixtures,conformance,index.ts}
└── __tests__/
```

## Contracts / API

`@stackra/contracts/analytics` owns `IAnalyticsEvent`, `IAnalyticsRecord`, `IAttribution`, `IMetricDefinition`, `IAggregationJob`, `IAnalyticsQuery`, `IAnalyticsResult` and relevant tokens.

```ts
ingest(events: readonly IAnalyticsEvent[]): Promise<IngestionResult>;
query(input: IAnalyticsQuery): Promise<IAnalyticsResult>;
rebuild(input: AnalyticsRebuildRequest): Promise<JobReference>;
```

## Analytical scope

Day-one analytical dimensions include application, tenant, time, campaign, source, medium, channel, ad/campaign identifier, placement, creative, anonymous/identified session and conversion. High-cardinality raw identifiers are retained only in appropriate raw/event storage and are not blindly promoted to metric dimensions.

Core measures include impressions, viewable impressions, clicks, sessions, conversions, revenue/conversion value where contractually available, CTR, CVR and attribution outcomes.

## Attribution

Attribution is analytical logic, not marketing execution. The plan defines deterministic attribution models and versioned model configuration. Changing an attribution model creates a new analytical model/version rather than silently rewriting historical results.

## Runtime / execution

- NestJS: authenticated analytical query/admin APIs, configuration and operational controls.
- Workers: ingestion, deduplication, enrichment, aggregation, backfills, retention and rebuilds.
- NATS/Queue: asynchronous transport only; they do not own analytics semantics.
- Browser/RN: no direct access to analytical storage.

## Persistence / compatibility

Raw analytical events, normalized facts, aggregates and model/version metadata are durable analytical data. Partitioning, retention, late-arrival handling, deduplication and backfill strategy are explicit. Analytical schemas are versioned and rebuildable from retained raw facts where the retention policy permits.

## Security / privacy / tenancy

Every analytical record has trusted tenant/application context where applicable. Access is tenant-isolated and authorization-aware. PII is minimized, retention/deletion policies are explicit, and raw identifiers are not exposed through generic analytics APIs. Consent/deletion signals from tracking are honored according to the applicable data policy.

## Observability

Analytics processing emits operational logs, traces and metrics through `@stackra/logger`/`@stackra/observability`. Business metrics produced by analytics are data products, not OTel operational metrics.

Required operational metrics include ingestion rate, rejected events, deduplication rate, processing latency, queue lag, late events, aggregation failures and backfill progress.

## Errors / recovery

Ingestion is idempotent. Malformed events are rejected/quarantined with bounded diagnostics. Worker retries use exponential backoff and DLQ handling. Aggregation jobs are checkpointed and resumable. Backfills never mutate source business records.

## Testing / conformance

Test event schema compatibility, deduplication, late events, attribution determinism, tenant isolation, consent/deletion behavior, aggregation correctness, rebuild determinism, worker retries and query authorization. Run representative load tests for ingestion and aggregation.

## Dependencies / exports / versioning

Analytics never exposes vendor warehouse SDKs through its root API. Storage adapters are explicit subpaths. Analytical event and metric schemas are versioned with migration/rebuild notes.

## Phases

1. contracts/schema vocabulary (2d); 2. ingestion/dedupe (2d); 3. analytical storage (3d); 4. dimensions/measures (2d); 5. attribution (2d); 6. aggregation workers (3d); 7. NestJS query/control API (2d); 8. privacy/tenancy/retention (2d); 9. conformance/load/recovery (1d); 10. docs/release (1d).

## Exit criteria

Analytics is a durable, tenant-isolated analytical system for product/campaign/ad behavior, with deterministic ingestion/aggregation/attribution and clear separation from tracking, marketing, usage billing and operational observability.

## Cross-references

`2026-09-03-tracking-package.md`, `2026-09-03-marketing-package.md`, `2026-09-03-enterprise-observability-plan.md`, `2026-09-03-schema-package.md`, `2026-09-03-nats-package.md`, `2026-09-03-queue-package.md`.
