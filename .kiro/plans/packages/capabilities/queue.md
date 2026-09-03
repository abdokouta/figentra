---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
status: canonical
---

# `@stackra/queue` — queue and background-job capability

**Status:** Canonical implementation plan  
**Owner:** Stackra platform  
**Purpose:** Provide one typed queue/job contract across Node/NestJS, Cloudflare Worker, browser/native inspection workflows and tests without leaking a provider into the root package.

## Ownership

`@stackra/queue` owns queue/job contracts, lifecycle state, dispatch semantics, retry policy, idempotency, DLQ semantics, processor discovery and runtime adapters. It does not own business workflows, cron scheduling, durable business state or domain data.

## Non-goals

- Workflow orchestration; use `@stackra/workflow`.
- Business persistence; use the owning service database.
- General pub/sub; use `@stackra/events`/NATS.
- Universal scheduler; scheduling triggers are an application/service concern.

## Subpath architecture

```text
@stackra/queue
@stackra/queue/nestjs
@stackra/queue/worker
@stackra/queue/browser
@stackra/queue/react
@stackra/queue/testing
```

Provider implementations are subpaths, never separate queue packages:

```text
@stackra/queue/bullmq
@stackra/queue/nats
@stackra/queue/cloudflare
@stackra/queue/memory
```

The root entry point is runtime-neutral and MUST NOT import Node, React or Cloudflare APIs.

## Source layout

```text
packages/queue/
├── src/core/{manager,job,processor,retry,idempotency,dlq,decorators,errors,types,module,index.ts}
├── src/nestjs/{module,health,lifecycle,index.ts}
├── src/worker/{consumer,bindings,lifecycle,index.ts}
├── src/browser/{offline-queue,index.ts}
├── src/react/{hooks,providers,index.ts}
├── src/testing/{mock-queue,mock-processor,assertions,index.ts}
└── __tests__/{unit,integration,conformance,runtime,security}/
```

## Locked contracts

```ts
interface IQueueManager {
  connection(name?: string): IQueueConnection;
}

interface IQueueConnection {
  dispatch<T>(name: string, payload: T, options?: IJobOptions): Promise<IJobHandle>;
  dispatchBatch<T>(jobs: readonly IDispatch<T>[]): Promise<readonly IJobHandle[]>;
  process<T>(name: string, handler: IProcessor<T>, options?: IProcessorOptions): void;
  size(): Promise<number>;
  pause(): Promise<void>;
  resume(): Promise<void>;
}

interface IJobOptions {
  delayMs?: number;
  priority?: 'high' | 'normal' | 'low';
  attempts?: number;
  backoff?: { type: 'fixed' | 'linear' | 'exponential'; delayMs: number; jitter?: boolean };
  timeoutMs?: number;
  idempotencyKey?: string;
}
```

Every connector implements the same lifecycle: queued → started → completed/retried/failed/dead-lettered. Job IDs and idempotency keys are opaque and stable.

## Provider/driver matrix

| Subpath | Runtime | Provider | Production role |
|---|---|---|---|
| `/bullmq` | Node | Redis/BullMQ | queue execution where selected by service deployment ADR |
| `/nats` | Node | NATS JetStream | durable event/job transport integration |
| `/cloudflare` | Worker | Cloudflare Queues | edge/serverless asynchronous work |
| `/memory` | all | in-process | tests/local only; forbidden in production |

A provider is selected through validated configuration. Production configuration MUST reject test-only drivers.

## Discovery and registration

`@Processor(name)` metadata is discovered through the owning runtime/container integration. Discovery finds handlers; the queue manager registers them against a configured queue. Discovery MUST be deterministic and registration MUST fail on duplicate job names unless an explicit versioned handler policy exists.

## Retry and DLQ

Retry decisions are deterministic and bounded. Only errors classified as retryable consume retry budget. Backoff supports jitter. After the attempt limit is exhausted, the job is moved to a DLQ with original queue, handler version, attempts, first/last failure, trace/correlation IDs and original idempotency key. Replaying a DLQ job creates a new execution attempt without mutating the original failure record.

## Idempotency and delivery

Delivery is at-least-once for durable backends. Handlers MUST be idempotent. The queue layer deduplicates identical dispatches when the selected backend supports durable idempotency; service-level idempotency remains authoritative for business effects.

## Backpressure and limits

Every connection defines maximum payload bytes, concurrency, in-flight jobs, retry budget, execution timeout and batch size. Consumers stop pulling when memory, connection or downstream capacity limits are exceeded. Queue workers must expose graceful drain behavior.

## Security and tenancy

Queue metadata must carry request/correlation/trace context and tenant ID when applicable, but must not contain access tokens or secrets. Tenant-sensitive payloads are encrypted or minimized according to service policy. Cross-tenant dispatch requires explicit system/service authorization. Operators cannot replay arbitrary tenant jobs without audited authorization.

## Errors and recovery

Typed errors distinguish configuration, unavailable backend, timeout, cancellation, serialization, retryable execution and permanent execution failure. Startup fails closed when a required durable provider is unavailable. Worker restart resumes from backend acknowledgement semantics rather than in-memory state.

## Observability

Emit queue/job metrics for depth, age, active count, latency, retry count, DLQ count and failure rate. Trace context is propagated into handlers. Logs include queue/job IDs and correlation identifiers but redact payload secrets. No payload content may be used as a metric label.

## Testing and conformance

All drivers run the same conformance suite: dispatch, ordering where promised, acknowledgement, retry, timeout, cancellation, idempotency, DLQ, pause/resume and restart recovery. Runtime suites cover NestJS and Worker semantics. Production acceptance uses real Redis/NATS/Cloudflare test infrastructure where applicable; memory fakes are insufficient as the sole integration evidence.

## Dependencies and exports

Core depends only on contracts/container/support/errors/logger interfaces. Runtime/provider dependencies are optional peer dependencies exposed solely through their subpaths. Explicit package exports prevent accidental access to implementation files.

## Implementation phases

1. Core contracts and lifecycle state.
2. Manager/connection abstraction and idempotency.
3. Retry/DLQ/backpressure.
4. NestJS integration and provider adapters.
5. Cloudflare Worker adapter.
6. Browser/offline and React adapters where required.
7. Testing/conformance/security/observability.
8. Release, migration and documentation.

## Exit criteria

One queue package provides all supported runtime/provider integrations through stable subpaths; no provider leaks through root exports; durable jobs are idempotent and replayable; limits, security, recovery and conformance tests are explicit.
