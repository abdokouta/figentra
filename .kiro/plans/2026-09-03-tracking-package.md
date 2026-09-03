---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/tracking` — privacy-aware product analytics

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, enterprise security standards  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/storage`, `@stackra/logger`  
**Design effort:** 14 days across 8 phases

## Purpose

Typed analytics events, consent enforcement, sampling, session/identity context, offline buffering and provider fan-out. Tracking is opt-in and privacy-minimized by design.

## Non-goals

- Observability/technical telemetry.
- Ad attribution SDK ownership.
- Arbitrary PII collection.

## Manager pattern

`TrackingManager extends MultipleInstanceManager<ITrackingProvider>` for named analytics destinations.

## Subpath layout

```text
packages/tracking/src/core/{tracking.module.ts,manager/,events/,consent/,session/,buffer/,redaction/,index.ts}
packages/tracking/src/providers/{posthog/,segment/,mixpanel/,console/}
packages/tracking/src/react/{provider/,hooks/,index.ts}
packages/tracking/src/native/{provider/,hooks/,index.ts}
packages/tracking/src/testing/{tracker-fixture.ts,index.ts}
```

## Contracts split

`@stackra/contracts/tracking` owns `ITrackingClient`, `ITrackingProvider`, `IAnalyticsEvent`, `IConsentManager` and `TRACKING_MANAGER`.

## Public API — locked

```ts
interface ITrackingClient { track<T>(event:string,payload:T):Promise<void>; identify(id:string,traits?:Record<string,unknown>):Promise<void>; reset():Promise<void>; consent():IConsentState; }
```

Event names and payloads are typed/registered. Consent is checked before every emission, including buffered events.

## Security / privacy

PII allowlists are explicit; passwords, tokens, auth headers and secrets are prohibited. Identity is pseudonymous by default. Data retention and deletion hooks are provider-aware. Tenant opt-out overrides application defaults.

## Errors / observability

Provider failure is fail-open for product execution: tracking must never block the user operation. Metrics report dropped/failed events and buffer depth without event payloads. Redaction happens before buffering.

## Persistence / compatibility

Offline buffers are versioned, size-bounded and encrypted where supported. Event schemas are versioned; incompatible buffered events are discarded with an auditable reason.

## Testing / conformance

Test consent, redaction, sampling, offline/reconnect, duplicate prevention, provider failure and deletion/reset semantics. Provider contract tests share one suite.

## Phases

1. Contracts/scaffold (2d); 2. event/consent model (2d); 3. manager/provider fan-out (2d); 4. buffer/session (2d); 5. React/RN adapters (2d); 6. security/privacy (1d); 7. conformance/observability (2d); 8. docs/release (1d).

## Exit criteria

Tracking never leaks prohibited data or blocks product operations; consent and deletion are enforced across providers and offline buffers.

## Cross-references

`2026-09-03-logger-package.md`, `2026-09-03-state-package.md`, enterprise security/observability plans.
