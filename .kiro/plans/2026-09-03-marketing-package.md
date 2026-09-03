---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/marketing` — campaigns, audiences and server-side activation

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/schema`, `@stackra/events`, `@stackra/identity`, `@stackra/notifications`, `@stackra/queue`, `@stackra/analytics`, `@stackra/observability`  
**Design effort:** 20 days across 10 phases

## Purpose

Own server-side marketing orchestration: campaigns, audiences, journeys, eligibility, consent/suppression, activation, campaign state and conversion/attribution integration. Marketing uses analytics; it does not own analytical storage or operational telemetry.

## Non-goals

- Authentication/identity ownership.
- Operational observability.
- Generic analytics warehouse/BI ownership.
- Notification provider infrastructure.
- Billable usage metering.
- Product-domain business rules that belong to applications.

## Boundary

```text
Tracking / domain events
          ↓
      Analytics
          ↓
 audience + campaign evaluation
          ↓
     Marketing
          ↓
 notification / ad / webhook providers
          ↓
 conversion + delivery events
          ↓
 Analytics
```

Marketing may consume analytical segments and emit campaign/conversion facts. Analytics remains responsible for analytical attribution and reporting.

## Manager pattern

`MarketingManager` coordinates campaign, audience, journey and activation policies. Provider/channel adapters are registered through the canonical manager/discovery pattern.

## Subpath layout

```text
packages/marketing/
├── src/core/{marketing.module.ts,manager,campaigns,audiences,journeys,eligibility,consent,activation,attribution,index.ts}
├── src/providers/{ads/,webhooks/,index.ts}
├── src/nestjs/{module.ts,controllers,guards,index.ts}
├── src/worker/{audience,evaluate,activate,schedule,retry,index.ts}
├── src/testing/{fixtures,conformance,index.ts}
└── __tests__/
```

## Contracts / API

`@stackra/contracts/marketing` owns `ICampaign`, `IAudience`, `IMarketingJourney`, `IEligibilityDecision`, `IActivation`, `IMarketingConsent`, `IConversionEvent` and relevant tokens.

```ts
createCampaign(input: CreateCampaignInput): Promise<ICampaign>;
evaluateAudience(input: AudienceEvaluationInput): Promise<IAudienceMembershipResult>;
activate(input: ActivationRequest): Promise<ActivationResult>;
recordConversion(input: IConversionEvent): Promise<void>;
```

## Server-side marketing

Server-side conversion/marketing integrations are explicit and consent-aware. Provider credentials are server-only. Browser tracking does not call ad-provider APIs with privileged credentials.

Supported activation classes may include email/SMS/push through `@stackra/notifications`, signed webhooks and approved advertising/conversion APIs. Provider-specific integrations remain adapters and never leak vendor SDK types through the core package.

## Runtime / execution

- NestJS: campaign/audience management APIs, admin/control operations, webhook endpoints and synchronous eligibility decisions where latency permits.
- Workers: audience calculation, campaign scheduling, journey transitions, activation, retries, provider calls, conversion forwarding and reconciliation.
- NATS/Queue: transport for asynchronous work; not business ownership.
- Browser/RN: consume public campaign configuration and emit tracking events; never hold privileged provider credentials.

## Security / privacy / tenancy

Tenant/application isolation is mandatory. Consent and suppression are checked immediately before activation. Unsubscribe, legal suppression and provider rejection are durable states. Marketing data access is authorization-controlled and PII minimized.

No marketing worker may activate a recipient without a valid consent/eligibility decision for that channel and tenant policy.

## Observability

Operational execution uses `@stackra/observability` and `@stackra/logger`: campaign evaluation latency, activation success/failure, provider latency, retry counts, queue lag and reconciliation drift. Campaign performance metrics are analytical outputs owned by `@stackra/analytics`.

## Errors / recovery

Activations are idempotent by campaign/member/action/provider key. Provider failures use bounded retry/backoff and DLQ. Permanent failures become terminal delivery/activation states and are reconciled. Scheduled work is durable and restart-safe.

## Persistence / compatibility

Marketing owns campaign, audience definition, journey state, consent/suppression references and activation state. It does not copy product transaction tables or analytical fact stores. Provider payload contracts are versioned and adapter-specific.

## Testing / conformance

Test eligibility, consent/suppression, tenant isolation, campaign state, scheduling, dedupe/idempotency, provider failures, retries, DLQ, conversion forwarding and reconciliation. Run sandbox tests for each production activation provider.

## Dependencies / exports / versioning

Core remains provider-neutral. Analytics and notifications are consumed through contracts. Provider SDKs are isolated in adapter subpaths. Campaign/event contracts are semver-governed.

## Phases

1. contracts/schema vocabulary (2d); 2. campaign model (2d); 3. audiences/eligibility/consent (3d); 4. journeys/scheduling (2d); 5. notification activation (2d); 6. server-side ad/conversion adapters (2d); 7. NestJS/worker runtimes (2d); 8. security/idempotency/recovery (2d); 9. conformance/load tests (1d); 10. docs/release (1d).

## Exit criteria

Marketing can safely manage campaigns/audiences and perform server-side activation without absorbing analytics, tracking, notification, identity or observability responsibilities.

## Cross-references

`2026-09-03-tracking-package.md`, `2026-09-03-analytics-package.md`, `2026-09-03-notifications-package.md`, `2026-09-03-identity-package.md`, `2026-09-03-enterprise-observability-plan.md`.
