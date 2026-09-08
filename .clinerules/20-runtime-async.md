# Cline Rule: Runtime, Queues and Schedulers

## Runtime model
The modular application may expose three roles from one source tree:
- `api`: HTTP and realtime ingress.
- `worker`: durable NATS/JetStream consumers and asynchronous jobs.
- `scheduler`: scheduled dispatch only; business logic remains in owning modules.

Do not create `<module>-worker` or `<module>-scheduler` business services merely because a module has asynchronous work.

## Messaging
Canonical durable async transport is NATS JetStream. Use HTTPS + OpenAPI for synchronous service/client calls. Redis is for cache, rate limiting, locks, and ephemeral coordination. Kafka requires an ADR.

## Transactional outbox
Every durable business event emitted from a database transaction must use an outbox. The outbox record and business state change commit in the same transaction. A publisher drains the outbox and is idempotent.

## Consumers
Consumers must:
- use durable consumer identities;
- acknowledge only after successful processing;
- be idempotent;
- define timeout, retry and backoff behavior;
- use a dead-letter strategy for poison messages;
- record correlation/request/trace context;
- avoid unbounded concurrency;
- expose lag, failures, retries and processing latency metrics.

Never put critical business state solely in a queue message.

## Jobs
Jobs belong to the module that owns the business operation. A job invokes an application use case. Job execution metadata, retry state and deduplication must be durable where correctness requires it.

## Schedulers
The scheduler runtime discovers registered schedule definitions and dispatches work. It does not own business rules. Scheduled execution must be safe under multiple scheduler instances through durable deduplication/leases/locks or an equivalent database-backed mechanism.

## Retries
Retry only transient failures. Use bounded exponential backoff with jitter. Never retry validation, authorization, permanent provider rejection, or non-idempotent operations without an explicit safe strategy.

## Graceful shutdown
API stops accepting new work and drains requests. Workers stop receiving new messages and finish or safely abandon in-flight work. Scheduler stops dispatching new executions. Connections and telemetry flush within bounded shutdown time.

## Scaling
Scale API by request load, worker by queue lag/concurrency, scheduler by scheduled dispatch throughput. Independent scaling does not imply independent business ownership.
