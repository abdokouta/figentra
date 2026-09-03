---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/tracking"
anchor_adrs: [ADR-0012, ADR-0023, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/schema", "@stackra/storage", "@stackra/events", "@stackra/observability"]
---
# `@stackra/tracking` — implementation plan

## Purpose
Behavioral/product event collection SDK for browser, React, React Native and desktop. Tracking owns consent-aware collection, event identity, attribution/session context, batching, bounded offline buffering and transport delivery. Analytics owns analytical ingestion/storage and interpretation. Marketing owns campaigns/activation.

## Event model
Supported event classes include page/screen view, product/content view, search, campaign view/click, ad impression/click, conversion and session lifecycle. Every event contains `eventId`, `eventName`, `eventVersion`, `occurredAt`, `runtime`, source, consent basis and bounded properties/context.

## Public API
```ts
interface TrackingClient {
  track<T extends TrackingEvent>(event:T):Promise<void>;
  trackBatch(events:readonly TrackingEvent[]):Promise<BatchResult>;
  identify(subject:TrackingSubject):Promise<void>;
  setAttribution(context:AttributionContext):void;
  consent(state:ConsentState):Promise<void>;
  flush(options?:FlushOptions):Promise<FlushResult>;
  pause():void;
  resume():void;
}
interface ConsentManager { get():ConsentState; set(state:ConsentState):Promise<void>; canCollect(category:TrackingCategory):boolean; }
interface EventBuffer { enqueue(event:TrackingEvent):Promise<void>; pending(limit:number):Promise<readonly TrackingEvent[]>; acknowledge(ids:readonly string[]):Promise<void>; }
interface BatchTransport { send(batch:readonly TrackingEvent[]):Promise<TransportReceipt>; }
```

## Source tree
```text
packages/tracking/
├── src/core/{tracking-client,tracker,event-builder,event-catalog,context,session,attribution,errors,index.ts}
├── src/consent/{manager,policies,categories,index.ts}
├── src/buffer/{memory,persistent,queue,limits,index.ts}
├── src/transport/{fetch,beacon,index.ts}
├── src/runtime/{browser,react,native,desktop,worker,index.ts}
├── src/testing/{tracking-fixture,event-recorder,transport-fixture,index.ts}
└── __tests__/{unit,property,integration,privacy,conformance}/
```

## Event authoring
Events are declared in `@stackra/contracts/tracking` with stable names and versions. Anonymous payloads and authenticated payloads have explicit schemas. Arbitrary object dumping is prohibited. Event properties have classification metadata and per-event size/cardinality limits.

## Consent/privacy
Collection and transmission are blocked unless the configured consent basis allows the event category. Consent changes affect future collection immediately and may trigger buffer purge policies. Pseudonymous identifiers are used where required. Secret values, tokens, passwords and raw authentication claims are rejected from event schemas.

## Session/attribution
Session ID is runtime-managed and rotates according to lifecycle policy. Attribution context can carry campaign/source/medium/referrer identifiers with expiry and bounded length. Client clocks are not trusted for security; server ingestion may normalize timestamps.

## Batching/transport
Events batch by max item count, bytes and elapsed interval. Browser uses `sendBeacon` for unload-safe best-effort delivery and fetch for normal delivery. Runtime adapters expose capability results; tracking never blocks critical UI rendering on analytics transport. Transport failures enqueue bounded retries.

## Offline buffering
Persistent buffering is optional per runtime. When enabled, events are serialized with schema version and encrypted/secured according to runtime capability. Queue depth/bytes have hard limits. Old/low-priority events may be dropped only according to an explicit event-class policy; security/consent changes can purge selected classes.

## Reliability/dedupe
Every event has a stable ID. Batches are at-least-once; Analytics deduplicates using event ID/version rules. Client retry does not change the event ID. Flush is idempotent. Network errors use exponential backoff + jitter and finite retry budget.

## Observability
SDK metrics: events accepted/rejected, queue depth/bytes, batch size, send latency, retries and drops. Diagnostics omit event property values. OTel spans are sampled and payload-free.

## Security
Public endpoint/base URL and API key/reference are explicit configuration. Credentials used by authenticated transport must not be exposed to arbitrary application code. CORS/CSP/browser lifecycle constraints are adapter concerns. Tenant context is included only when trusted by the host application; Analytics remains the server-side tenant boundary.

## Testing
Event schema/contract conformance; consent transitions; attribution expiry; dedupe IDs; offline queue persistence/restart; batching thresholds; unload/beacon behavior; retry/backpressure; sensitive-property rejection; runtime lifecycle; Analytics ingestion compatibility. Property tests generate random event batches to prove bounded serialization.

## Implementation phases
1. Event catalog/contracts and core tracker.
2. Consent/session/attribution context.
3. batch/buffer/transport engine.
4. persistent offline buffer and runtime adapters.
5. privacy/security/observability testing.
6. Analytics integration and conformance verification.

## Exit criteria
- Every tracked event has a versioned contract and consent category.
- Buffer/transport behavior is bounded and crash-resumable where persistence exists.
- Sensitive fields cannot enter event payloads.
- Analytics is the only analytical storage owner.
- Runtime adapters pass web/native/desktop conformance.
