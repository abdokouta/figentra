# @figentra/queue

Provider-neutral queue contracts and adapters.

## Providers

- Cloudflare Queues: Worker-native durable delivery.
- SQS: AWS queue delivery, including delay/FIFO fields where supported by the queue.
- Redis: lightweight list-based provider for infrastructure where Redis is already the transport.
- BullMQ: Nest/Node adapter for Redis-backed job processing and worker semantics.
- Custom: implement `QueueProvider`.

Use the provider capabilities instead of assuming every queue has identical semantics. For example, FIFO, deduplication and delay are capabilities, not universal guarantees.

## Boundary

Queues are for asynchronous delivery, buffering and fan-out. Durable multi-step orchestration belongs to `@figentra/workflows`.
