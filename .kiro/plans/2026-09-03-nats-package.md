---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/nats` — enterprise NATS transport and JetStream

**Status:** Planned  
**Anchor ADRs:** ADR-0018, ADR-0020, ADR-0022, ADR-0023, ADR-0024, ADR-0090, ADR-0091  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/logger`, `@stackra/schema`  
**Design effort:** 18 days across 9 phases

## Purpose

Canonical service-to-service NATS transport. Supports typed publish/subscribe, request/reply, queue groups, JetStream persistence, acknowledgements, replay, bounded retries, dead-letter handling, idempotency and correlation propagation.

## Non-goals

- In-process events (`@stackra/events`).
- Browser WebSocket transport (`@stackra/realtime`).
- Business workflow orchestration.

## Manager pattern

`NatsManager extends MultipleInstanceManager<INatsConnection>` per ADR-0090. Named connections are independently configured and lazily created.

## Subpath layout

```text
packages/nats/
├── src/core/{nats.module.ts,manager/,protocol/,subjects/,publish/,subscribe/,request/,errors/,registries/,index.ts}
├── src/node/{nats.driver.ts,jetstream.driver.ts,index.ts}
├── src/nestjs/{nats.module.ts,decorators/,interceptors/,health/,index.ts}
├── src/worker/{client.ts,index.ts}
├── src/testing/{mock-nats.ts,jetstream-fixture.ts,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/transport` owns `INatsConnection`, `IMessage`, `IPublisher`, `ISubscriber`, request/reply options, acknowledgement policy and `NATS_MANAGER`/`NATS_CONNECTION` tokens.

## Public API — locked

```ts
interface INatsConnection {
  publish<T>(subject: string, payload: T, options?: IPublishOptions): Promise<void>;
  subscribe<T>(subject: string, handler: IMessageHandler<T>, options?: ISubscribeOptions): Promise<ISubscription>;
  request<TReq,TRes>(subject: string, payload: TReq, options?: IRequestOptions): Promise<TRes>;
  stream(name: string): IJetStream;
}
```

Subjects are versioned (`domain.resource.action.v1`) and validated against an allowlist. Payloads are schema-validated before publication and after receipt for trusted boundaries.

## JetStream semantics

Consumers use durable names, explicit ack policy, max-deliver, ack wait, max acknowledgement pending, replay policy and retention. Delivery is at-least-once; handlers MUST be idempotent. Poison messages move to a declared DLQ subject/stream after bounded delivery attempts.

## Runtime / lifecycle

Node/Nest owns TCP/TLS connection lifecycle and graceful drain. Worker support is limited to supported HTTP-compatible NATS deployments and MUST NOT assume a long-lived socket in a request isolate. Core contains no vendor import.

## Security

TLS and credentials are mandatory in production. Subject permissions are least-privilege and connection-specific. Credentials never appear in logs. Payloads are size-bounded and tenant authorization is enforced before subscription/handler execution where applicable.

## Errors / retry / cancellation

Connection, timeout, unavailable, authorization and serialization errors normalize through `@stackra/errors`. Request timeouts use `AbortSignal`; retries use bounded exponential backoff + jitter and only retry known transient classes. Publishing is not automatically retried when doing so could duplicate a non-idempotent operation.

## Observability

Metrics: publish/consume/request counts, latency, ack latency, redelivery, DLQ, connection state and queue depth. Traces propagate correlation/request/trace IDs in headers. Logs use structured redaction.

## Persistence / compatibility

JetStream stream/consumer definitions are infrastructure contracts and are versioned. Subject and payload changes follow `@stackra/schema` compatibility rules. Stream migrations are additive first, destructive only after consumer inventory and drain.

## Testing / conformance

Use a real disposable NATS/JetStream integration environment for protocol behavior. Unit tests cover serialization and policies; contract tests cover publish/subscribe/request; failure tests cover disconnect, redelivery, timeout, duplicate delivery and DLQ. No fake protocol implementation is accepted as the sole integration test.

## Dependencies / exports / versioning

Core depends only on contracts/container/errors/schema/logger. Node/Nest adapters depend on the NATS client as an optional peer. Public protocol changes require semver and Changesets.

## Phases

1. Contracts/scaffold (2d).
2. Manager/connection lifecycle (2d).
3. Publish/subscribe/request protocol (3d).
4. JetStream/durability/DLQ (3d).
5. NestJS integration/discovery (2d).
6. Security/observability/retry policies (2d).
7. Worker boundary (1d).
8. Real integration/conformance suite (2d).
9. Docs/release (1d).

## Exit criteria

Typed publish/subscribe and request/reply work against real NATS; JetStream redelivery/DLQ are deterministic; duplicate delivery is safely handled; credentials and payloads are protected; graceful drain completes without message loss beyond the declared delivery semantics.

## Cross-references

`2026-09-03-events-package.md`, `2026-09-03-schema-package.md`, `2026-09-03-queue-package.md`, ADR-0018/0020/0022/0023/0024.
