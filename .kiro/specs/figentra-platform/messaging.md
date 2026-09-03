# Figentra Messaging & Async Execution Contract

**Status:** Normative / implementation locked

## 1. Decision

The canonical Figentra inter-service messaging platform is **NATS + JetStream**.

Redis is a supporting infrastructure technology, not the durable business event bus. Kafka is an optional specialized streaming platform and requires an ADR before introduction.

## 2. Transport matrix

| Requirement | Technology |
|---|---|
| External synchronous API | HTTPS + OpenAPI |
| Internal synchronous control-plane call | HTTPS + typed SDK; NATS request/reply only where justified |
| Durable service event | NATS JetStream |
| Durable async command/job | NATS JetStream |
| Transactional publication | Outbox → NATS JetStream |
| Cache | Redis |
| Distributed lock | Redis with bounded lease |
| Rate limiting | Redis or provider-native limiter |
| Edge buffering | Cloudflare Queues where edge-native |
| Long-running orchestration | Workflow service / Cloudflare Workflow where explicitly edge-native |
| High-volume streaming/data platform | Kafka only by ADR |

## 3. NATS

Use `@nats-io/transport-node` for Node/NestJS integration. Do not introduce the legacy `nats` package as the canonical adapter.

NATS Core is appropriate for ephemeral pub/sub and request/reply. JetStream is required when delivery must survive process/network failure or consumers need acknowledgement/replay/redelivery semantics.

## 4. JetStream contract

Every durable stream defines:

- stream name;
- subjects;
- retention policy;
- storage mode;
- replication factor;
- max age/bytes/messages;
- consumer policy;
- ack policy;
- max deliveries;
- backoff;
- dead-letter/reconciliation policy;
- ownership;
- schema versions;
- observability dimensions.

Consumers MUST be idempotent. Event identity is the primary dedupe key. Business idempotency keys are used where an operation can be repeated with different transport messages.

## 5. Event envelope

```ts
interface EventEnvelope<T> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  producer: string;
  tenantId?: string;
  principalId?: string;
  correlationId: string;
  causationId?: string;
  traceId?: string;
  payload: T;
}
```

Cross-service event contracts live in `@stackra/contracts`. Producers own event meaning; consumers never import producer implementation types.

## 6. Outbox

For every transaction that changes durable state and emits a durable event:

```text
BEGIN
  domain mutation
  outbox insert
COMMIT
        ↓
outbox relay
        ↓
JetStream publish
```

The relay records publication state and supports safe retry. A relay crash after publication must not corrupt correctness; consumers deduplicate by immutable event ID.

## 7. Retry/DLQ

Retries use bounded exponential backoff with jitter and a maximum delivery count. Permanent validation/authorization failures are not retried indefinitely. Terminal messages enter the service-owned failure/reconciliation path with enough metadata to diagnose and replay safely.

## 8. Request/reply

NATS request/reply is allowed for internal calls when latency and topology make it materially better than HTTP. It is still authenticated, versioned and authorized. It does not bypass Identity/IAM or create an implicit RPC contract outside `@stackra/contracts`.

## 9. Redis

Redis is never the authoritative source of business state and never the only durable copy of a business event. Cache keys must encode tenant/scope/application dimensions where relevant. Locks require lease expiration and safe release. Redis outages must fail open/closed according to the specific operation's correctness policy, never by accident.

## 10. Kafka gate

Kafka may be added only when measured requirements justify Kafka-specific streaming characteristics such as very high sustained throughput, large retention/replay workloads, partition-oriented stream processing, or ecosystem integration. The ADR must define why JetStream is insufficient, ownership, schemas, retention, operations, security, cost, and migration/exit strategy.

## 11. Worker contract

Every JetStream/Queue consumer has:

- bounded concurrency;
- cancellation support;
- timeout/deadline;
- idempotency;
- explicit ack/nack behavior;
- retry policy;
- terminal failure handling;
- readiness and graceful shutdown;
- lag/in-flight/failure metrics;
- trace propagation;
- no process-global mutable tenant state.

## 12. Forbidden patterns

- Redis Pub/Sub as durable domain events.
- Kafka by default in every service.
- Direct DB polling as an event bus.
- Publishing directly from a controller after a transaction.
- Unversioned cross-service event payloads.
- Browser/user token reused as a service credential.
- Consumers importing another service's ORM entities.
- Unbounded retries.
- A second event bus without an ADR.
