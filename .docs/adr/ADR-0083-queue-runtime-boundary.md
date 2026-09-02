# ADR-0083 — Queue Provider Boundary

## Status
Accepted

## Decision

`@figentra/queue` is the single provider-neutral queue abstraction. It exposes a
small message contract plus explicit provider capabilities. Supported adapters are
Cloudflare Queues, SQS, Redis, BullMQ and custom providers.

The application chooses one provider per workload. The abstraction does not erase
provider semantics: FIFO, deduplication, delay, dead-lettering, batching and
consumer support are capabilities and must be checked explicitly.

- Cloudflare Workers: Cloudflare Queues is the native default.
- AWS workloads: SQS is available without changing application-level message code.
- Existing Redis infrastructure: Redis provider is available.
- Nest/Node jobs needing BullMQ worker semantics: BullMQ provider is available.

Queues are not durable orchestration. Multi-step execution belongs to
`@figentra/workflows`.

## Important non-goal

Do not provision multiple queue providers for the same workload merely for
redundancy. High availability and migration are deployment concerns; the provider
contract exists to avoid application rewrites when the selected transport changes.
