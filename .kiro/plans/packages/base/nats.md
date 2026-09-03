---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/nats"
anchor_adrs: [ADR-0020, ADR-0023]
depends_on: ["@stackra/contracts", "@stackra/config", "@stackra/observability", "@stackra/errors"]
---
# `@stackra/nats` — implementation plan

## Purpose
Canonical NATS transport adapter for synchronous request/reply and durable/asynchronous messaging. NATS is transport only; business DTOs/events/commands belong to `@stackra/contracts`. Durable publication is coupled to service transactional outbox.

## Public API
```ts
interface NatsClient {
  connect(options:NatsConnectionOptions):Promise<void>;
  request<TReq,TRes>(subject:string,payload:TReq,options?:RequestOptions):Promise<TRes>;
  publish<T>(subject:string,payload:T,options?:PublishOptions):Promise<PublishReceipt>;
  subscribe<T>(subject:string,handler:NatsHandler<T>,options?:ConsumerOptions):Promise<Subscription>;
  drain(deadlineMs:number):Promise<void>;
  close():Promise<void>;
}
interface NatsConsumer { ack():Promise<void>; nack(delayMs?:number):Promise<void>; term():Promise<void>; }
```

## Source tree
```text
packages/nats/
├── src/core/{client.ts,connection.ts,subjects.ts,headers.ts,codec.ts,errors/,index.ts}
├── src/jetstream/{stream.ts,consumer.ts,publish.ts,ack.ts,index.ts}
├── src/nestjs/{nats.module.ts,transport.ts,decorators/,index.ts}
├── src/testing/{in-memory-broker.ts,nats-fixture.ts,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Subject/contract rules
Subjects are explicit, versioned and allowlisted. Consumers subscribe only to declared service-owned subjects. Payload schema/version is validated before handler execution. Tenant/request/correlation/causation metadata is carried in headers/envelope, never trusted from raw payload fields.

## JetStream semantics
Durable streams use explicit storage, retention, acknowledgement deadlines, max-deliver, backoff and DLQ/quarantine policy. Consumers are at-least-once. Exactly-once effects are achieved by idempotent service handlers/outbox processing, not by assuming transport delivery guarantees.

## Reliability
Reconnect/backoff is bounded. Consumer concurrency and pending message counts are limited. ACK happens only after successful durable handling. NACK/redelivery is reserved for classified transient failures. Permanent validation/security failures are terminal/quarantined. Graceful shutdown drains producers then consumers within deadline.

## Security
TLS and credentials are required from secret-manager/config references. Subject and account allowlists prevent unauthorized publish/subscribe. Payload logging is disabled by default. Connection metadata and auth headers are redacted.

## NestJS/runtime
NestJS integration provides module configuration, injection tokens, controller/consumer decorators and lifecycle hooks. Core is runtime-neutral Node; Worker/browser use platform-specific capability adapters only where supported.

## Observability
Metrics: connection state, request latency, publish latency, consumer lag, redeliveries, DLQ depth, ACK failures and active consumers. OTel context is injected/extracted through NATS headers.

## Testing
Connection outage/reconnect, request timeout, publish failure, duplicate delivery, ACK/NACK semantics, max-delivery/DLQ, bounded concurrency, subject authorization and trace propagation. A conformance harness validates every enabled runtime/adapter.

## Implementation phases
1. Connection/client and subject envelope.
2. Request/reply and publish/subscribe.
3. JetStream streams/consumers/ack/retry/DLQ.
4. NestJS integration and lifecycle.
5. Observability/security/configuration.
6. Conformance, outage/load testing and production rollout.

## Exit criteria
- One NATS abstraction is used across services.
- JetStream delivery policy is explicit per stream/consumer.
- No service logs raw message payloads by default.
- Durable work is idempotent and outbox-backed.
- No Kafka/alternative transport is introduced without ADR.
