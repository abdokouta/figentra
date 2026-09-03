---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/pipeline"
anchor_adrs: [ADR-0090, ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/container", "@stackra/errors", "@stackra/support", "@stackra/observability"]
---
# `@stackra/pipeline` — implementation plan

**Status:** Planned — implementation contract

## Purpose

`@stackra/pipeline` is the canonical runtime-neutral execution pipeline used for ordered middleware and step composition. It carries typed context, cancellation, deadlines, execution metadata, error policy and lifecycle hooks. It is reused by API handlers, consumers, workers and internal orchestration without embedding business rules.

## Non-goals

- HTTP routing or controller ownership.
- Durable workflow state, timers or compensation; those belong to `@stackra/workflow` and the Workflow service.
- Queue delivery, scheduling and transport retries.
- Hidden global execution state.

## Architecture

A pipeline is an immutable ordered graph of `Step` objects. One invocation receives a fresh execution context. Steps can short-circuit, transform output or call the next step. The core package has no NestJS, browser, database or provider dependency.

```text
packages/pipeline/
├── package.json
├── tsconfig.json
├── src/
│   ├── core/
│   │   ├── pipeline.ts
│   │   ├── step.ts
│   │   ├── execution.ts
│   │   ├── context.ts
│   │   ├── composition.ts
│   │   ├── policies.ts
│   │   ├── lifecycle.ts
│   │   ├── constants/
│   │   ├── errors/
│   │   └── index.ts
│   ├── testing/
│   │   ├── pipeline-fixture.ts
│   │   ├── spy-step.ts
│   │   └── index.ts
│   └── index.ts
└── __tests__/
    ├── unit/
    └── integration/
```

## Public API — locked

```ts
export interface PipelineContext {
  executionId: string;
  requestId: string;
  correlationId: string;
  causationId?: string;
  traceId?: string;
  tenantId?: string;
  deadlineAt?: number;
  signal: AbortSignal;
  values: Map<string, unknown>;
}

export interface Step<TContext, TInput, TOutput> {
  readonly name: string;
  execute(
    ctx: TContext,
    input: TInput,
    next: () => Promise<TOutput>,
  ): Promise<TOutput>;
}

export interface Pipeline<TInput, TOutput> {
  use(step: Step<PipelineContext, unknown, unknown>): this;
  execute(input: TInput, context: PipelineContext): Promise<TOutput>;
}

export interface PipelineExecutionOptions {
  deadlineAt?: number;
  signal?: AbortSignal;
  maxSteps?: number;
}
```

### Required implementation classes

- `PipelineImpl<TInput,TOutput>` — immutable compiled execution chain.
- `PipelineBuilder` — validates and freezes steps.
- `PipelineExecution` — owns invocation metadata and lifecycle state.
- `PipelineContextFactory` — creates explicit per-execution context.
- `PipelineErrorMapper` — maps thrown values to `@stackra/errors`.
- `PipelineMetrics` — emits execution/step telemetry without business semantics.

## Execution algorithm

1. Validate the pipeline configuration when built.
2. Generate/accept an execution ID.
3. Reject an already-aborted signal before invoking the first step.
4. Check the deadline before every step.
5. Invoke exactly one step at a time in deterministic order.
6. Preserve the original error cause while adding safe step metadata.
7. Run lifecycle finalizers in reverse registration order.
8. Emit completion/failure telemetry after execution state is known.
9. Never retry implicitly.

## Composition rules

The package supports `use`, `compose`, `branch`, and explicitly bounded `parallel` helpers. Parallel execution requires a caller-supplied concurrency limit and deterministic aggregation behavior. Unlimited `Promise.all` fan-out is prohibited.

## Error model

The package defines `PipelineConfigurationError`, `PipelineCancelledError`, `PipelineDeadlineExceededError`, `PipelineStepError` and `PipelineInvariantError`. Error codes are stable. Errors contain execution ID and step name, never arbitrary payloads, credentials or secret values.

## Cancellation/deadlines

Cancellation is cooperative through `AbortSignal`. A child operation must receive the same signal or a derived signal with an earlier deadline. Deadline expiration is terminal for that invocation. A cancelled pipeline never retries itself.

## Runtime behavior

The root export is runtime-neutral. API services, NestJS consumers and workers use the same core. Any runtime integration belongs in an adapter or application package and cannot add framework semantics to the core interfaces.

## Observability

OpenTelemetry integration creates a pipeline span and optional step spans. Metrics include execution count, success/failure count, cancellation count, deadline failures, total duration and per-step duration. Correlation/request/trace IDs are propagated from `PipelineContext`. Telemetry failure must never fail the pipeline.

## Security and tenancy

Tenant and principal metadata is contextual, not globally mutable. The pipeline never performs authorization itself. Authorization occurs in the service request pipeline through IAM before business execution. Context diagnostic values use an allowlist and are redacted before logging.

## Concurrency/resource limits

Production defaults must limit maximum step count, context entries, execution duration and parallel concurrency. Implementations must avoid event-loop blocking and unbounded buffering. Resource limits fail deterministically with typed errors.

## Testing

Unit tests cover ordering, short-circuit behavior, nested composition, cancellation, deadlines, error cause preservation, finalizers and resource limits. Integration tests exercise API, NATS consumer and worker context construction. Property tests generate random step chains and verify deterministic order and cleanup. A conformance suite is exported from `@stackra/pipeline/testing`.

## Dependencies and exports

Required dependencies are workspace contracts/errors/support/container. Observability is optional at compile time but the runtime integration must be supported. No `@figentra/*` dependency is permitted. Public exports are versioned and listed in the package manifest.

## Implementation phases

### Phase 1 — Scaffold and contracts
- Create package manifest and subpath exports.
- Create locked interfaces, tokens and errors.
- Add testing fixtures.

### Phase 2 — Engine
- Implement immutable pipeline compilation.
- Implement sequential execution and short-circuit semantics.
- Implement context/deadline/cancellation handling.

### Phase 3 — Composition and limits
- Implement branching and bounded parallelism.
- Implement lifecycle/finalizer support.
- Enforce resource limits.

### Phase 4 — Observability and runtime conformance
- Add OTel instrumentation.
- Add API/NATS/worker fixtures.
- Verify correlation propagation.

### Phase 5 — Failure and release verification
- Failure injection and concurrency tests.
- Compatibility fixtures.
- Documentation and release validation.

## Exit criteria

- Public API frozen and documented.
- No hidden retries, unbounded concurrency or framework coupling.
- 90%+ branch coverage on core.
- Cancellation/deadline semantics proven under integration tests.
- At least one production API and one worker use the same pipeline implementation.
- No duplicate pipeline engine exists elsewhere in the repository.
