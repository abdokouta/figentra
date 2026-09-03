# Final Workflow & Queue Contract

**Status:** Accepted

## Workflow boundary

`@figentra/workflows` is the provider-neutral declaration and adapter package.
It does not persist execution state. Cloudflare Workflows, Temporal, Vercel
Workflow and custom runtimes own durability and lifecycle.

A workflow is composed of explicit durable steps. Step results are passed
through the workflow context from durable step return values; mutable metadata
is not an execution-state store.

`@figentra/state-machines` is separate and owns synchronous domain transitions,
guards and state-change notifications. It is not a workflow runtime.

NestJS decorators are discovery metadata only. There is no second hidden
lifecycle engine. Durable side effects belong to explicit steps or explicit
step-local adapter boundaries.

## Queue boundary

`@figentra/queue` is the provider-neutral asynchronous transport boundary.
Supported adapters are Cloudflare Queues, SQS, Redis lists and BullMQ, plus
custom providers.

The provider contract supports:

- publish;
- optional batch publish;
- optional pull consumption;
- explicit provider capabilities;
- closeable consumer subscriptions.

Cloudflare Queue consumption is platform-push and therefore uses `handleBatch()`
rather than pretending to expose a pull consumer. Redis lists intentionally do
not advertise leases, FIFO, deduplication or DLQ. SQS and BullMQ adapters only
advertise capabilities implemented by the adapter.

## Package boundaries

```text
@figentra/state-machines  -> domain state transitions
@figentra/workflows       -> durable workflow definitions + runtime adapters
@figentra/queue           -> asynchronous message transport adapters
```

No application may couple its domain/workflow code directly to a queue or
workflow vendor when the provider-neutral package is sufficient.

## Validation

Repository structural gates must pass before merge. Full dependency
installation, package typecheck/build, Cloudflare deployment, real queue
delivery and real workflow execution remain environment-dependent verification
gates and must not be represented as locally executed when dependencies or
credentials are unavailable.
