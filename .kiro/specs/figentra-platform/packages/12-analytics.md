# Analytics Package — Kiro Implementation Specification

**Package:** `@stackra/analytics`  
**Path:** `packages/analytics`  
**Purpose:** Durable product, campaign and advertising analytics ingestion, aggregation, attribution and analytical queries.

## Boundary

Analytics owns analytical facts/read models. It consumes tracking and relevant domain events but never becomes the source of truth for the underlying business transaction.

## Owns

- event ingestion and deduplication;
- analytical facts and aggregates;
- dimensions/measures;
- attribution models and versions;
- retention/late-event/backfill handling;
- analytical query/read models.

## Must not own

- tracking SDK/consent collection;
- marketing campaign execution;
- operational logs/traces/metrics;
- notification delivery;
- billable usage metering;
- security audit records.

## Contracts

`@stackra/contracts/analytics` owns `IAnalyticsEvent`, `IAnalyticsRecord`, `IAttribution`, `IMetricDefinition`, `IAggregationJob`, `IAnalyticsQuery`, `IAnalyticsResult` and relevant tokens.

## Runtime

NestJS owns authenticated query/control APIs. Workers own ingestion, deduplication, enrichment, aggregation, backfills and retention. NATS/Queues are transport mechanisms, not analytics ownership.

## Data model

Support product/ad metrics such as impressions, viewable impressions, clicks, sessions, conversions, CTR, CVR and conversion value where contractually available. Attribution models are versioned so historical results are reproducible.

## Security/tenancy

Tenant/application isolation is mandatory. PII is minimized and access is authorization-controlled. Consent/deletion policies are honored. High-cardinality raw identifiers are not exposed as generic metric dimensions.

## Observability

Operational processing uses `@stackra/observability` and `@stackra/logger`. Analytical metrics are data products and are not OTel operational metrics.

## Testing

Test ingestion idempotency, schema compatibility, attribution determinism, aggregation correctness, late events, rebuilds, deletion/retention and tenant authorization. Load-test ingestion and worker processing.

## Acceptance

Analytics provides durable, deterministic analytical data while remaining separate from tracking, marketing, usage and operational observability.
