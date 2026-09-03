---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/notifications` — multi-channel notification delivery

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0023, ADR-0024  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/queue`, `@stackra/events`, `@stackra/schema`, `@stackra/logger`, `@stackra/i18n`  
**Design effort:** 18 days across 9 phases

## Purpose

Unified notification orchestration for email, SMS, push, in-app, webhook and realtime delivery. Owns templates, localization, user preferences, deduplication, retries, failover, delivery state and auditability while delegating actual delivery to providers.

## Non-goals

- Mail transport implementation.
- Queue infrastructure.
- Authentication or user profile storage.

## Manager pattern

`NotificationManager extends MultipleInstanceManager<INotificationChannel>`; channels are named and independently configured.

## Subpath layout

```text
packages/notifications/
├── src/core/{notifications.module.ts,manager/,channels/,templates/,preferences/,delivery/,dedupe/,errors/,index.ts}
├── src/email/{providers/,index.ts}
├── src/sms/{providers/,index.ts}
├── src/push/{providers/,index.ts}
├── src/webhook/{providers/,index.ts}
├── src/nestjs/{notifications.module.ts,health/,index.ts}
├── src/worker/{bindings/,index.ts}
├── src/react/{hooks/,components/,index.ts}
├── src/native/{hooks/,index.ts}
├── src/testing/{notification-fixture.ts,mocks/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/notifications` owns `INotification`, `INotificationChannel`, `INotificationTemplate`, `IDeliveryAttempt`, `INotificationPreference`, `NOTIFICATION_MANAGER` and channel contracts.

## Public API — locked

```ts
interface INotificationService {
  send(notification: INotificationRequest): Promise<INotificationResult>;
  schedule(notification: INotificationRequest, at: Date): Promise<string>;
  cancel(id: string): Promise<void>;
}
```

Delivery is asynchronous by default through `@stackra/queue`; synchronous provider calls are bounded and explicit. Every notification has a deterministic idempotency key.

## Security

Recipient addresses, tokens and provider credentials are sensitive. Templates are trusted application assets and cannot execute arbitrary code. Webhooks require signed payloads, replay protection and endpoint allowlists. Tenant preferences are isolated.

## Errors / recovery / observability

Provider failures use bounded retry/backoff and channel failover policy. Permanent failures enter terminal delivery state and emit audit events. Metrics cover attempts, latency, provider failures, bounce/rejection and queue lag.

## Persistence / compatibility

Delivery state is durable and append-only at the attempt level. Template and payload schemas are versioned. Retention is configurable and compliant with tenant policy; sensitive content is minimized.

## Testing / conformance

Contract tests cover every channel. Integration tests use provider sandbox endpoints where possible. Test dedupe, retry, failover, preference suppression, localization, signed webhook verification and tenant isolation.

## Dependencies / exports / versioning

Provider SDKs are optional peers under channel subpaths. Core has no provider SDK. Public notification/event contracts are semver-governed.

## Phases

1. Contracts/scaffold (2d); 2. manager/channel model (2d); 3. templates/i18n/preferences (3d); 4. queue/dedupe/retry (3d); 5. email/SMS/push/webhook adapters (3d); 6. Nest/Worker/UI (2d); 7. security/observability (1d); 8. conformance (1d); 9. docs/release (1d).

## Exit criteria

Every channel is contract-compatible, delivery is idempotent, retries are bounded, preferences are enforced before send, and all sensitive provider data is redacted.

## Cross-references

`2026-09-03-queue-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-i18n-package.md`, ADR-0090/0091.
