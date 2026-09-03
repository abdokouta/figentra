---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/worker"
anchor_adrs: [ADR-0020, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/nats", "@stackra/errors", "@stackra/observability"]
---
# `@stackra/worker` — implementation plan

## Purpose
Canonical worker execution boundary for Node/container/edge runtimes. It provides explicit invocation context, bounded concurrency, cancellation, execution deadlines, lease/fencing integration, retry/DLQ hooks, health/readiness and graceful drain. Domain retry semantics remain owned by the service.

## Public API
```ts
interface WorkerRuntime {
  start():Promise<void>;
  execute<T>(invocation:WorkerInvocation<T>):Promise<WorkerResult>;
  drain(deadlineMs:number):Promise<void>;
  stop():Promise<void>;
}
interface WorkerInvocation<TPayload> {
  id:string; subject:string; payload:TPayload; context:RequestContext; deadlineAt:number;
}
interface WorkerPolicy {
  concurrency:number; maxAttempts:number; ackDeadlineMs:number; maxPayloadBytes:number;
}
interface Lease {
  owner:string; fencingToken:string; expiresAt:number;
  renew():Promise<void>; release():Promise<void>;
}
```

## Source tree
```text
packages/worker/
├── src/core/{runtime,invocation,context,lifecycle,policy,execution,errors,index.ts}
├── src/concurrency/{semaphore,queue,backpressure,index.ts}
├── src/retries/{classifier,backoff,dead-letter,index.ts}
├── src/leases/{lease,heartbeat,fencing,index.ts}
├── src/health/{live,ready,index.ts}
├── src/runtime/{node,container,edge,index.ts}
├── src/testing/{worker-fixture,broker-fixture,lease-fixture,index.ts}
└── __tests__/{unit,integration,conformance,failure}/
```

## Invocation semantics
Each invocation has stable ID, trusted RequestContext, deadline and delivery attempt. Payload schema is validated before handler execution. The handler acknowledges only after durable business completion. Duplicate invocation IDs must have idempotent effect at the service/application boundary.

## Concurrency/backpressure
Semaphore-controlled concurrency is mandatory. Queue depth, payload bytes, execution duration and in-flight invocations have hard limits. When capacity is exhausted, the runtime applies explicit backpressure to the transport instead of allocating unbounded memory.

## Retry/DLQ
Runtime exposes retry hooks and classification but does not infer domain retryability. Transient errors may NACK with bounded backoff; terminal validation/security errors are sent to DLQ/quarantine. Max attempts and DLQ subject are explicit per consumer.

## Lease/fencing
For partitioned/scheduled work requiring exclusive ownership, acquire a lease with fencing token. Every side-effecting commit must present the current fencing token when the backing system supports it. Expired owners cannot commit after a new owner is elected.

## Cancellation/lifecycle
`start → ready → draining → stopped`. Abort signals propagate into handlers. Draining rejects new work and waits only to the configured deadline before force-closing. Signal handling belongs to the Node/container runtime adapter.

## Context/security
Request/correlation/causation/trace/tenant/principal metadata is explicit. No process-global mutable tenant state. Payload and headers are excluded from diagnostics unless explicitly classified. Worker runtime never authorizes business actions itself; services/IAM do.

## Health
Liveness reports process/runtime health. Readiness verifies required broker/database dependencies according to the service role. Health endpoints use shared runtime contracts and never expose secret/config details.

## Observability
Metrics: active invocations, concurrency saturation, execution latency, retries, DLQ depth, lease expiry, queue lag and shutdown drain time. OTel spans connect transport delivery→handler→dependency operations. No raw payload logging.

## Testing
Concurrency limit, cancellation, deadline, duplicate delivery, retry classification, DLQ, lease race/fencing, queue overload, graceful drain and dependency outage. Failure injection verifies no work is acknowledged before durable completion.

## Implementation phases
1. Core invocation/context/lifecycle.
2. concurrency/backpressure and deadlines.
3. retry/DLQ hooks.
4. lease/fencing support.
5. health/observability/runtime adapters.
6. conformance/failure/load testing.

## Exit criteria
- All service worker roles use this execution lifecycle.
- No unbounded worker queue or hidden global state exists.
- Retry/DLQ semantics are explicit per consumer.
- Lease/fencing protects exclusive scheduled/partition work.
- Graceful drain and failure recovery are proven.
