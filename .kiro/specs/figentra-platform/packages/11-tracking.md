# Tracking Package — Kiro Implementation Specification

**Package:** `@stackra/tracking`  
**Path:** `packages/tracking`  
**Purpose:** Product, campaign and advertising behavioral event collection with consent, attribution and bounded delivery.

## Boundary

Tracking is the collection SDK. It owns intentional behavioral events and consent-aware client/server submission. It does not own operational telemetry, durable analytical storage, marketing campaigns or billable usage.

## Owns

- product/page/screen events;
- campaign/ad impression/click/conversion events;
- tracking context and attribution;
- consent/suppression checks;
- batching, offline buffering and deduplication;
- schema validation and privacy filtering;
- transport/provider adapters.

## Must not own

- OpenTelemetry traces/metrics/logs;
- analytics aggregation/read models;
- campaign/audience execution;
- notification delivery;
- security audit;
- billable usage metering.

## Contracts

`@stackra/contracts/tracking` owns `ITrackingEvent`, `ITrackingClient`, `ITrackingContext`, `IConsentState`, `ICampaignAttribution`, `ITrackingTransport` and tracking DI tokens.

## Runtime

Browser/RN/Desktop use bounded offline buffers. Node/Worker can submit directly or through queue/NATS. Tracking remains runtime-neutral and never accesses analytics storage directly.

## Security/privacy

Schema-deny sensitive fields by default. Never accept raw credentials, auth headers, payment secrets or arbitrary request bodies. Tenant/application context is trusted and cross-tenant submission fails closed.

## Observability

Tracking operational behavior is observed through `@stackra/observability`; event payloads are not automatically copied into logs/traces/metrics. Product/ad events are handled by `@stackra/analytics`.

## Testing

Test consent, attribution, schema validation, dedupe, offline replay, buffer limits, redaction, tenant isolation and transport failure across supported runtimes.

## Acceptance

Tracking can emit versioned, privacy-safe behavioral events without becoming an analytics engine, marketing engine or operational telemetry system.
