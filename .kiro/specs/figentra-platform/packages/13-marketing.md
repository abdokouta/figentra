# Marketing Package — Kiro Implementation Specification

**Package:** `@stackra/marketing`  
**Path:** `packages/marketing`  
**Purpose:** Server-side campaigns, audiences, journeys, eligibility and activation.

## Boundary

Marketing owns campaign orchestration and activation. It consumes identity, consent, analytics segments and tracking/domain facts. It does not own analytics storage, tracking collection, notification provider infrastructure or operational telemetry.

## Owns

- campaigns;
- audience definitions/membership orchestration;
- eligibility and suppression;
- journeys and scheduling;
- activation state;
- server-side conversion forwarding;
- campaign/provider adapter contracts.

## Must not own

- authentication/identity;
- IAM authorization;
- operational logs/traces/metrics;
- analytics warehouse/attribution reporting;
- notification provider infrastructure;
- billable usage.

## Contracts

`@stackra/contracts/marketing` owns `ICampaign`, `IAudience`, `IMarketingJourney`, `IEligibilityDecision`, `IActivation`, `IMarketingConsent`, `IConversionEvent` and relevant tokens.

## Runtime

NestJS owns campaign/audience management APIs and webhooks. Workers own audience evaluation, scheduling, activation, provider calls, retries and reconciliation. NATS/Queues transport asynchronous work.

## Security/privacy

Consent/suppression is checked immediately before activation. Provider credentials are server-only. Tenant isolation is mandatory. Browser/mobile clients never receive privileged advertising credentials.

## Observability

Marketing execution emits operational logs/traces/metrics through `@stackra/logger` and `@stackra/observability`. Campaign performance is analytical data owned by `@stackra/analytics`.

## Testing

Test eligibility, consent, tenant isolation, scheduling, idempotency, retries, provider failures, DLQ and reconciliation using provider sandboxes.

## Acceptance

Marketing can perform safe server-side activation and conversion forwarding while analytics, tracking, notifications, identity and observability remain separate authorities.
