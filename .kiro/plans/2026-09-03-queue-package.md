---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# @stackra/queue — architecture plan

**Status:** Planned
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md),
[ADR-0018](../../.docs/adr/ADR-0018-service-to-service-transport.md),
[ADR-0083](../../.docs/adr/ADR-0083-queue-runtime-boundary.md)
**Reference:** `.ref/packages/queue/` (`@stackra/queue` v0.1.0)
**Depends on:** `@stackra/container` (Task 13), `@stackra/contracts` (Task 6),
`@stackra/support` (Manager), `@stackra/logger` (job lifecycle logs)

## Purpose

`@stackra/queue` is the workspace's unified job-queue abstraction. Enterprise
requirements day one:

- **N named queues per service** — `emails`, `notifications`, `webhooks`,
  `analytics`. Each with its own connector + config.
- **Retries with exponential backoff + jitter** — per-job policy.
- **Dead-letter queue (DLQ)** — failed jobs after N retries route to DLQ for
  manual inspection.
- **Delayed jobs** — `queue.dispatch(job, { delay: 60_000 })`.
- **Priority queues** — `{ priority: "high" | "normal" | "low" }`.
- **Idempotency** — `{ idempotencyKey }` — duplicate dispatches within a
  window resolve to the SAME job.
- **Job chains + batches** — sequence of jobs with cancel-on-any-fail
  semantics.
- **Observability** — every job emits `job.queued`, `job.started`,
  `job.retried`, `job.failed`, `job.completed` events via `@stackra/events`.
- **Auto-discovery** — `@Processor(name)`-decorated classes auto-register
  via `IDiscoveryService`.
- **Rate-limiting** — per-queue max-jobs-per-second.
- **Concurrency** — per-queue max-parallel-workers.
- **Cross-runtime** — Node/NestJS uses BullMQ or NATS JetStream; Workers use
  Cloudflare Queues; browser uses BroadcastChannel + IndexedDB (offline
  queue).

## Non-goals

- Full workflow orchestration (that's `@stackra/workflow` per ADR-0086).
- Distributed transactions (2PC) — jobs must be idempotent.
- Full task scheduler with cron — that's `@stackra/scheduler` (planned).
- Real-time pub/sub — that's `@stackra/realtime`.

## Manager pattern — MultipleInstanceManager (Shape B per ADR-0090)

`QueueManager extends MultipleInstanceManager<IQueueConnection>` — each named
queue is its own instance with its own driver + config.

```typescript
QueueModule.forRoot({
  default: "default",
  connections: {
    default: { driver: "bullmq", connection: "primary", redis: "primary" },
    emails: { driver: "bullmq", connection: "primary", concurrency: 5, redis: "primary" },
    webhooks: { driver: "nats", subject: "webhooks.>", redis: "primary" },
    analytics: { driver: "cloudflare-queue", binding: "ANALYTICS_QUEUE" },
    dead-letter: { driver: "memory" }, // just for inspection UI
  },
});
```

## Subpath layout (per ADR-0091)

```
packages/queue/
├── src/
│   ├── core/
│   │   ├── queue.module.ts
│   │   ├── commands/                  # CLI: queue:work, queue:retry, queue:clear, queue:failed
│   │   ├── connectors/                # from .ref: broadcast-channel, indexeddb, local-storage, memory, null, sync, qstash
│   │   ├── constants/                 # QUEUE_* metadata keys, QUEUE_EVENTS
│   │   ├── decorators/                # @Processor(name), @OnJobFailed, @OnJobCompleted
│   │   ├── errors/                    # JobFailedError, JobTimeoutError, ConnectorError
│   │   ├── interfaces/                # local
│   │   ├── services/                  # QueueManager, WorkerService, QueueEventBus, ProcessorSubscribersLoader, QueueHandle
│   │   ├── types/                     # IJob, IJobPayload, IJobResult, JobStatus enum
│   │   ├── utils/                     # backoff calc, jitter, idempotency-key hasher
│   │   └── index.ts
│   │
│   ├── nestjs/
│   │   ├── queue.module.ts            # + BullMQ driver auto-registered
│   │   ├── connectors/
│   │   │   ├── bullmq.connector.ts    # via `bullmq` package
│   │   │   └── nats.connector.ts      # via NATS JetStream (ADR-0018/0020)
│   │   ├── health/
│   │   │   └── queue.health-indicator.ts
│   │   └── index.ts
│   │
│   ├── react/                         # Admin/inspection UI hooks (optional)
│   │   ├── hooks/                     # useQueueStats(), useFailedJobs()
│   │   └── index.ts
│   │
│   ├── worker/
│   │   ├── queue.module.ts
│   │   ├── connectors/
│   │   │   ├── cloudflare-queues.connector.ts
│   │   │   └── durable-object-queue.connector.ts
│   │   ├── consumer-router.ts         # binds fetch handler to Queue consumer
│   │   └── index.ts
│   │
│   └── testing/
│       ├── mock-queue.ts              # in-memory connector w/ .flushAll(), .assertDispatched()
│       ├── mock-worker.ts             # ProcessorSpy w/ .assertProcessed(), .assertFailed()
│       └── index.ts
│
├── __tests__/
├── ...manifests
```

## Contracts split

| Symbol                        | Kind      |
| ----------------------------- | --------- |
| `IQueueConnector`             | interface |
| `IQueueConnection`            | interface |
| `IQueueManager`               | interface |
| `IJob<TPayload, TResult>`     | interface |
| `IJobOptions`                 | interface |
| `IProcessor<TPayload>`        | interface |
| `IQueueEventBus`              | interface |
| `JobStatus` enum              | enum      |
| `QUEUE_MANAGER`               | token     |
| `QUEUE_CONFIG`                | token     |
| `QUEUE_EVENT_BUS`             | token     |
| `QUEUE_EVENTS`                | constant map |
| `JobFailedError`              | class     |
| `JobTimeoutError`             | class     |

## Core API (locked)

```typescript
interface IQueueManager {
  connection(name?: string): IQueueConnection;
}

interface IQueueConnection {
  // Dispatch
  dispatch<TPayload>(name: string, payload: TPayload, options?: IJobOptions): Promise<IJobHandle>;
  dispatchChain(jobs: Array<{ name: string; payload: unknown; options?: IJobOptions }>): Promise<IJobHandle>;
  dispatchBatch(jobs: Array<{ name: string; payload: unknown }>): Promise<IJobHandle[]>;

  // Introspection + control
  size(): Promise<number>;
  clear(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  // Worker (server-side)
  process<TPayload>(name: string, handler: IProcessor<TPayload>, options?: IProcessorOptions): void;
}

interface IJobOptions {
  delay?: number;              // ms
  priority?: "high" | "normal" | "low";
  attempts?: number;           // default: 3
  backoff?: { type: "exponential" | "linear" | "fixed"; delay: number; jitter?: boolean };
  timeout?: number;            // ms
  idempotencyKey?: string;
  removeOnComplete?: boolean | number;  // keep last N, or false to keep all
  removeOnFail?: boolean | number;
}

interface IProcessor<TPayload> {
  (job: IJob<TPayload>): Promise<unknown> | unknown;
}
```

## Connectors (locked catalogue)

| Connector           | Home                                            | Runtime | Backend                          |
| ------------------- | ----------------------------------------------- | ------- | -------------------------------- |
| `memory`            | `core/connectors/memory.connector.ts`           | Every   | In-process Map + setTimeout      |
| `null`              | `core/connectors/null.connector.ts`             | Every   | No-op                            |
| `sync`              | `core/connectors/sync.connector.ts`             | Every   | Fire synchronously (dev/tests)   |
| `broadcast-channel` | `core/connectors/broadcast-channel.connector.ts` | Browser | BroadcastChannel (cross-tab)     |
| `indexeddb`         | `core/connectors/indexeddb.connector.ts`        | Browser | IDB (offline queue)              |
| `local-storage`     | `core/connectors/local-storage.connector.ts`    | Browser | localStorage (fallback)          |
| `qstash`            | `core/connectors/qstash.connector.ts`           | Every   | Upstash QStash HTTP              |
| `bullmq`            | `nestjs/connectors/bullmq.connector.ts`         | Node    | Redis + BullMQ                   |
| `nats`              | `nestjs/connectors/nats.connector.ts`           | Node    | NATS JetStream (ADR-0018/0020)   |
| `cloudflare-queues` | `worker/connectors/cloudflare-queues.connector.ts` | Worker  | env.QUEUE binding                |

## Decorators + Auto-registration

`@Processor(name)` marks a class as a job handler:

```typescript
@Processor("send-welcome-email")
@Injectable()
export class SendWelcomeEmailProcessor implements IProcessor<{ userId: string }> {
  public constructor(@Inject(EMAIL_SERVICE) private readonly mail: IEmailService) {}

  public async handle(job: IJob<{ userId: string }>): Promise<void> {
    await this.mail.sendTemplate("welcome", { userId: job.payload.userId });
  }
}
```

`ProcessorSubscribersLoader` (from `.ref/packages/queue/src/core/services/`)
walks discovered `@Processor` classes at `OnApplicationBootstrap` and
registers each with the appropriate queue via `manager.connection().process()`.

Additional decorators:

- `@OnJobFailed(queueName)` — subscriber on job-failed events.
- `@OnJobCompleted(queueName)` — subscriber on job-completed events.
- `@Retryable({ attempts, backoff })` — per-processor default retry.

## DLQ + retry semantics

- Every failed job increments `attempts` counter. After
  `options.attempts` (default 3) the job routes to the `<queue>.dead-letter`
  destination.
- DLQ is a separate connector-registered queue (BullMQ has native DLQ; NATS
  uses stream max-deliver + Terminal ack; Cloudflare Queues has a
  `deadLetterQueue` binding).
- CLI `queue:failed` lists DLQ jobs. `queue:retry <id>` re-dispatches from
  DLQ back to origin queue.

## Events lifecycle

Every job dispatched OR processed emits through `@stackra/events` (Task
`@stackra/events`):

```
QUEUE_EVENTS.QUEUED       → { jobId, queue, name, payload, attempt: 0, dispatchedAt }
QUEUE_EVENTS.STARTED      → { jobId, queue, name, workerId, startedAt }
QUEUE_EVENTS.PROGRESS     → { jobId, queue, progress: 0-100 }
QUEUE_EVENTS.COMPLETED    → { jobId, queue, name, result, durationMs }
QUEUE_EVENTS.RETRIED      → { jobId, queue, name, attempt, nextRetryAt, error }
QUEUE_EVENTS.FAILED       → { jobId, queue, name, error, attempts }
QUEUE_EVENTS.DEAD_LETTERED → { jobId, queue, name, error }
```

Downstream: audit trail (`@stackra/audit`), Sentry hooks, monitoring gauges.

## Health indicator

`QueueHealthIndicator` reports per-connection:

- `queue.<name>.size` — pending job count.
- `queue.<name>.workers` — active worker count.
- `queue.<name>.dlq` — DLQ size.
- `queue.<name>.errorRate` — % failed jobs last 5 min.

## Dependencies

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/container": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/logger": "workspace:*",
    "@stackra/events": "workspace:*",
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "react": "catalog:react",
    "bullmq": "^5.0.0",
    "nats": "^2.29.0"
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "bullmq": { "optional": true },
    "nats": { "optional": true }
  }
}
```

## Phases

### Phase 1 — Contracts + Scaffold (2 days)

- [ ] Contracts split: interfaces + tokens + errors + `QUEUE_EVENTS` map.
- [ ] `packages/queue/` scaffold with 5 subpaths.

### Phase 2 — Core (4 days)

- [ ] `QueueManager`, `QueueEventBus`, `WorkerService`, `QueueHandle`.
- [ ] 7 base connectors (memory, null, sync, broadcast-channel, indexeddb,
      local-storage, qstash).
- [ ] `@Processor` + `@OnJobFailed` + `@OnJobCompleted` decorators.
- [ ] Backoff calculators (linear, exponential, fixed) + jitter.
- [ ] Idempotency-key hasher.
- [ ] Retry + DLQ routing.

### Phase 3 — NestJS (3 days)

- [ ] `QueueModule.forRoot()` + `forRootAsync()`.
- [ ] `BullMQConnector` via `bullmq` package.
- [ ] `NatsConnector` via NATS JetStream.
- [ ] `ProcessorSubscribersLoader` — auto-register `@Processor`-decorated
      classes.
- [ ] `QueueHealthIndicator`.
- [ ] CLI commands (`queue:work`, `queue:retry`, `queue:clear`, `queue:failed`).

### Phase 4 — Worker subpath (2 days)

- [ ] `CloudflareQueuesConnector` — reads `env.QUEUE_*` bindings.
- [ ] `DurableObjectQueueConnector` — DO-backed queue for stateful
      workflows.
- [ ] Consumer-router: binds Worker's `queue()` handler to
      `WorkerService.process()`.

### Phase 5 — Browser (1 day)

- [ ] `BroadcastChannelConnector` + `IndexedDBConnector` +
      `LocalStorageConnector` for offline queue in the browser (PWA).
- [ ] React hooks: `useQueueStats(name)`, `useFailedJobs(name)`.

### Phase 6 — Testing (1 day)

- [ ] `MockQueue.assertDispatched()`, `.assertNotDispatched()`,
      `.assertProcessed()`, `.flushAll()`.
- [ ] `MockWorker` for processor testing.

### Phase 7 — Docs + Release (2 days)

**Total effort:** 15 days.

## Success criteria

- [ ] 5 subpath exports build cleanly.
- [ ] BullMQ round-trip (dispatch → process → complete) works against a real
      Redis in integration test.
- [ ] Cloudflare Queues consumer smoke test (Miniflare) processes 100
      messages.
- [ ] DLQ: force 5 failures → job lands in `<queue>.dead-letter`.
- [ ] Idempotency: 3 dispatches with same key + 5s window → 1 job runs.
- [ ] Metrics: hit / process / retry / fail counters exposed by health
      indicator.

## Cross-references

- ADR-0090, 0091, 0092, 0018 (NATS), 0083 (queue runtime boundary).
- `.kiro/plans/2026-09-03-events-package.md` — job lifecycle events.
- `.kiro/plans/2026-09-03-redis-package.md` — BullMQ Redis backend.
- `.ref/packages/queue/` — reference (7 connectors + services).
