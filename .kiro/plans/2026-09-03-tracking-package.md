---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/tracking` — product, campaign and ad behavioral tracking

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/schema`, `@stackra/identity`, `@stackra/config`, `@stackra/observability`  
**Design effort:** 14 days across 8 phases

## Purpose

Provide the cross-runtime SDK for collecting intentional product, campaign and advertising behavioral events. Tracking is the producer/collection boundary; it is not the analytics warehouse, operational telemetry system or marketing engine.

## Non-goals

- OpenTelemetry logs, traces or metrics.
- Durable analytics aggregation/query ownership.
- Campaign orchestration or notification delivery.
- Billable usage metering.
- Security/business audit records.
- Provider-specific analytics platform ownership.

## Manager pattern

`TrackingManager extends MultipleInstanceManager<ITrackingProvider>` and coordinates event capture, consent policy, batching and transport. Runtime adapters provide storage and network behavior.

## Subpath layout

```text
packages/tracking/
├── src/core/{tracking.module.ts,manager/,events/,context/,consent/,attribution/,buffer/,redaction/,transport/,index.ts}
├── src/browser/{storage/,transport/,lifecycle/,index.ts}
├── src/react/{provider/,hooks/,index.ts}
├── src/native/{storage/,transport/,lifecycle/,index.ts}
├── src/node/{transport/,index.ts}
├── src/worker/{transport/,index.ts}
├── src/testing/{tracker-fixture.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/tracking` owns `ITrackingEvent`, `ITrackingClient`, `ITrackingContext`, `IConsentState`, `ICampaignAttribution`, `ITrackingProvider`, `ITrackingTransport`, `TRACKING_MANAGER` and related tokens.

## Public API — locked

```ts
interface ITrackingClient {
  track<T>(event: string, payload: T): Promise<void>;
  identify(input: TrackingPrincipal): Promise<void>;
  page(input: PageView): Promise<void>;
  screen(input: ScreenView): Promise<void>;
  flush(): Promise<void>;
  reset(): Promise<void>;
}
```

Event names and payload schemas are versioned and registered. No automatic "track everything" behavior is permitted.

## Event classes

```text
product: page_view, feature_used, search, checkout, purchase
campaign: campaign_view, campaign_click, campaign_conversion
ad: impression, viewable_impression, click, conversion
lifecycle: install, session_start, session_end
```

Ad/campaign identifiers are behavioral dimensions, not operational telemetry labels.

## Consent / privacy

Tracking honors applicable consent and tenant/application policy before collection and transmission. Sensitive fields are schema-denied by default. Raw authentication tokens, passwords, payment credentials and arbitrary request bodies are prohibited.

## Runtime / execution

Browser/RN/Desktop use bounded offline buffers and batch transport. Server-side tracking may submit events directly or through NATS/queue. Tracking does not require NestJS and never owns the durable analytical store.

## Relationship to observability

A user click may produce both a product tracking event and an operational span, but neither is generated from the other. Operational telemetry follows security/observability policy; behavioral tracking follows consent/product policy.

## Errors / recovery

Tracking transport failures are bounded and non-fatal to product UX by default. Buffers have hard size/count/age limits, retry with jitter and deterministic deduplication. Compliance-required tracking behavior is explicit application policy.

## Security / isolation

Tenant/application context is explicit and cannot be overridden by arbitrary client input. Event payloads are schema-validated and redacted before transport. Cross-tenant submission is rejected. Identity identifiers are pseudonymous unless an explicit lawful/product contract requires identification.

## Testing / conformance

Test schema validation, consent suppression, attribution propagation, deduplication, offline replay, bounded buffers, tenant isolation, payload redaction and transport failure. Runtime adapters use deterministic clocks and IDs.

## Dependencies / exports / versioning

Core exports provider-neutral tracking behavior. Destination SDKs remain isolated behind provider/runtime subpaths. Tracking event schemas use semver and compatibility rules.

## Phases

1. contracts/schema vocabulary (2d); 2. manager/context (2d); 3. consent/privacy (2d); 4. attribution/ad events (2d); 5. browser/RN/desktop/server adapters (2d); 6. batching/offline/dedupe (2d); 7. security/conformance (1d); 8. docs/release (1d).

## Exit criteria

Tracking reliably collects intentional product/campaign/ad events across supported runtimes without owning analytics storage, marketing activation, operational telemetry or audit semantics.

## Cross-references

`2026-09-03-enterprise-observability-plan.md`, `2026-09-03-analytics-package.md`, `2026-09-03-marketing-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-identity-package.md`.
