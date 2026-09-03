---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/notifications` — multi-channel notification orchestration and delivery

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0023, ADR-0024  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/queue`, `@stackra/events`, `@stackra/schema`, `@stackra/logger`, `@stackra/observability`, `@stackra/i18n`  
**Design effort:** 18 days across 9 phases

## Purpose

Unified notification orchestration for email, SMS, push, in-app, webhook and realtime delivery. Owns templates, localization, preferences, deduplication, scheduling, delivery state, retries and provider policy while delegating transport to providers.

## Non-goals

- Authentication/identity ownership.
- Marketing campaign ownership.
- Queue infrastructure ownership.
- Operational observability ownership.
- Mail/SMS/push provider credentials outside provider adapters.

## Boundary

Notifications is a reusable capability. It is not synonymous with a NestJS service and not itself a worker. Runtime adapters compose the capability into control-plane APIs and asynchronous delivery workers.

```text
Application / Marketing / Workflow
              ↓
      notification command
              ↓
       Queue / NATS
              ↓
    Notification Worker
              ↓
     Provider adapter
              ↓
      delivery outcome
              ↓
   event / audit / analytics
```

## Manager pattern

`NotificationManager extends MultipleInstanceManager<INotificationChannel>`; channels are named and independently configured. Provider selection is explicit and validated at startup.

## Subpath layout

```text
packages/notifications/
├── src/core/{notifications.module.ts,manager/,channels/,templates/,preferences/,scheduling/,delivery/,dedupe/,errors/,index.ts}
├── src/email/{providers/,index.ts}
├── src/sms/{providers/,index.ts}
├── src/push/{providers/,index.ts}
├── src/webhook/{providers/,index.ts}
├── src/nestjs/{notifications.module.ts,controllers/,health/,index.ts}
├── src/worker/{consumer/,dispatch/,retry/,index.ts}
├── src/react/{hooks/,components/,index.ts}
├── src/native/{hooks/,index.ts}
├── src/testing/{notification-fixture.ts,mocks/,provider-conformance/,index.ts}
└── __tests__/
```

## Contracts / API

`@stackra/contracts/notifications` owns `INotification`, `INotificationRequest`, `INotificationChannel`, `INotificationTemplate`, `IDeliveryAttempt`, `INotificationPreference`, `INotificationResult`, `NOTIFICATION_MANAGER` and channel/provider contracts.

```ts
send(notification: INotificationRequest): Promise<INotificationResult>;
schedule(notification: INotificationRequest, at: Date): Promise<string>;
cancel(id: string): Promise<void>;
```

`send()` submits asynchronous delivery by default. Direct provider execution is a bounded internal operation used by the worker, not a reason to block request handlers.

## Runtime placement

| Runtime | Responsibility |
|---|---|
| NestJS | authenticated notification management APIs, templates/preferences, query/status APIs, administrative controls |
| Worker | queue consumption, scheduling, provider calls, retry/backoff, delivery reconciliation |
| Browser/React | in-app/realtime consumption and user preference UI; never provider credentials |
| React Native | push token registration and notification UX; delivery remains server-side |
| Desktop | local notification presentation where explicitly supported |

## Security / tenancy

Recipient addresses, push tokens and provider credentials are sensitive. Templates cannot execute arbitrary code. Tenant/application isolation is mandatory. Webhooks require signed payloads, replay protection and endpoint allowlists. Marketing activation must pass through the same notification preference/consent enforcement.

## Errors / recovery / observability

Provider failures use bounded retry/backoff and channel failover policy. Permanent failures enter terminal delivery state. Metrics cover attempts, latency, provider failures, queue lag, bounce/rejection and retry/DLQ counts. Traces cover enqueue → worker → provider. Logs are structured and redacted.

## Persistence / compatibility

Delivery state is durable and append-only at the attempt level. Template and payload schemas are versioned. Retention is configurable and tenant-policy compliant. Sensitive message content is minimized; provider response bodies are not persisted by default.

## Testing / conformance

Contract tests cover every channel/provider. Integration tests use provider sandbox endpoints where possible. Test dedupe, retry, failover, preference suppression, localization, signed webhook verification, tenant isolation, queue recovery and worker restart behavior.

## Dependencies / exports / versioning

Provider SDKs are isolated under channel subpaths. Core has no provider SDK dependency. Notification commands/events are versioned and semver-governed.

## Phases

1. Contracts/scaffold (2d); 2. manager/channel model (2d); 3. templates/i18n/preferences (3d); 4. queue/scheduling/dedupe/retry (3d); 5. provider adapters (3d); 6. NestJS/Worker/UI runtime integration (2d); 7. security/observability (1d); 8. conformance/recovery tests (1d); 9. docs/release (1d).

## Exit criteria

Every channel is contract-compatible, delivery is asynchronous/idempotent, retries are bounded, preferences/consent are enforced before send, provider secrets are isolated and worker recovery is restart-safe.

## Cross-references

`2026-09-03-queue-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-i18n-package.md`, `2026-09-03-analytics-package.md`, `2026-09-03-marketing-package.md`, `2026-09-03-enterprise-observability-plan.md`.
