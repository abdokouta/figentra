---
status: canonical
component: package
package: "@stackra/tracking"
runtime: browser,react,react-native,desktop
---
# `@stackra/tracking` — enterprise implementation plan

## Purpose
Reusable behavioral/product event collection SDK. It collects consent-aware events, attribution context, session context, offline buffers, batching and delivery. It does not own analytics storage or campaign decisions.

## Event classes
Page/screen views, product/content views, search, campaign view/click, ad impression/click, conversion and session lifecycle. Event identity, schema version, timestamp, source/runtime and consent state are mandatory.

## Layout
`src/contracts`, `src/core`, `src/consent`, `src/context`, `src/buffer`, `src/transport`, `src/runtime`, `src/index.ts`.

## Public API
`TrackingClient`, `Tracker`, `ConsentManager`, `AttributionContext`, `EventBuffer`, `BatchTransport`, configuration and typed event contracts. Analytics ingestion/storage remains service-owned.

## Runtime
Browser: beacon/fetch and page lifecycle. React/React Native/desktop: lifecycle-aware adapters and durable local buffer where available. No runtime-specific APIs in core.

## Reliability
Event IDs for dedupe, bounded batches, backpressure, offline persistence limits, retry with jitter, dead-letter/drop policy by event class and cancellation. Never block critical UI paths on analytics delivery.

## Privacy/security
Consent gates collection and transmission; configurable PII allowlist; identifiers pseudonymized where required; no secrets. Data minimization and retention metadata are explicit.

## Observability
SDK diagnostics use structured logs/OTel without duplicating event payloads. Measure queue depth, batch size, send latency, failures and drops.

## Testing
Schema/contract conformance, consent transitions, attribution, dedupe, offline/restart recovery, batching, retry/backpressure, runtime adapters and privacy redaction.

## Compatibility
Versioned event schemas; backward-compatible ingestion expectations; explicit runtime exports and semver. No hidden analytics storage dependency.

## Exit criteria
Production-ready collection SDK with real transports, durable bounded buffering, consent enforcement, versioned events and cross-runtime conformance.
