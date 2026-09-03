# ADR-0086 — Provider-Neutral Workflow DSL

**Status:** Accepted

## Context

Medusa demonstrates useful functional workflow composition through
`createWorkflow()` and `createStep()`, while its own orchestration runtime owns
transaction state and execution. `nestjs-workflow` demonstrates a useful NestJS
state-machine model with typed states/events, guards, entity adapters and
DI-backed actions. Workflow SDK demonstrates a durable-programming model where
ordinary TypeScript functions are broken into durable execution boundaries.

Figentra should borrow these API ideas without importing another orchestration
engine.

## Decision

The primary framework API is functional and explicit:

```ts
const validate = createStep("validate", validateInput);
const provision = createStep("provision", provisionTenant, {
  retry: { limit: 5, delay: "10 seconds", backoff: "exponential" },
  compensate: deleteTenant,
});

const workflow = createWorkflow(
  "tenant.provision",
  [validate, provision],
  (results) => response(results[1]),
  { version: "1" },
);
```

`@figentra/workflows` provides provider adapters for Cloudflare Workflows,
Temporal, Vercel Workflow SDK and custom runtimes. It does not persist workflow
state itself.

Nest decorators are optional discovery metadata. They do not define a second
runtime.

## Hooks

Global `@Before()` / `@After()` lifecycle semantics are deliberately not the
workflow engine. Side-effecting work that must be durable is an explicit step.
Hook metadata may be used for local composition/discovery, but the provider
adapter must map durable work to provider-native execution boundaries.

## State machines

State-machine behavior is a separate concern and now belongs to
`@figentra/state-machines`. It provides typed states, allowed transitions,
guards, transition handlers and state-change notifications without durable
workflow execution.

## Queue boundary

`@figentra/queue` is similarly provider-neutral and supports Cloudflare Queues,
SQS, Redis, BullMQ and custom adapters. Queues provide asynchronous delivery,
buffering and fan-out; they do not replace durable workflows.
