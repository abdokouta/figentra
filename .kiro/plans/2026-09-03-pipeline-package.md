---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/pipeline` — typed middleware and execution pipeline

**Status:** Planned  
**Anchor ADRs:** ADR-0090, ADR-0091, ADR-0092  
**Depends on:** `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/logger`  
**Design effort:** 10 days across 7 phases

## Purpose

A runtime-neutral, ordered execution pipeline for middleware, interceptors and processors. It provides deterministic composition, short-circuiting, error boundaries, cancellation, timeout and per-stage observability without coupling domain code to HTTP or NestJS.

## Non-goals

- HTTP routing, queue scheduling or event transport.
- Global mutable middleware registries.

## Manager pattern

No Manager. `PipelineFactory` builds immutable pipelines and `PipelineRegistry` stores named definitions when discovery is required.

## Subpath layout

```text
packages/pipeline/
├── src/core/{pipeline.module.ts,builders/,stages/,context/,errors/,registries/,utils/,index.ts}
├── src/nestjs/{pipeline.module.ts,interceptors/,index.ts}
├── src/worker/{pipeline.module.ts,index.ts}
├── src/testing/{test-pipeline.ts,spies/,index.ts}
└── __tests__/
```

## Contracts split

`@stackra/contracts/pipeline` owns `IPipeline`, `IPipelineStage`, `IPipelineContext`, `IPipelineResult`, cancellation/options types and `PIPELINE` token.

## Public API — locked

```ts
interface IPipeline<TContext, TResult> {
  execute(context: TContext, signal?: AbortSignal): Promise<TResult>;
}
interface IPipelineStage<TContext, TResult> {
  execute(context: TContext, next: () => Promise<TResult>, signal: AbortSignal): Promise<TResult>;
}
```

Stages execute in declared order. A stage may short-circuit intentionally; accidental omission of `next()` is detectable in test mode. Exceptions are normalized and retain the original cause.

## Runtime / discovery

Core has no runtime globals. Nest adapters expose interceptors; Worker adapters compose with request execution and `waitUntil`. Discovery follows find → registry → factory semantics and is optional.

## Configuration / security

Bound maximum stages, execution time and metadata size. No arbitrary code may be loaded from configuration. Context is immutable by default; mutation requires an explicit mutable context object.

## Errors / recovery / observability

Stage timeout becomes `TIMEOUT`; cancellation preserves `AbortError` semantics; failures identify stage name and duration. Metrics cover stage latency/failure counts and short-circuit rates. Sensitive context is redacted before logs.

## Persistence / tenancy

No persistence. Tenant context is carried through pipeline context and may not be inferred from mutable globals.

## Testing / conformance

Verify order, nesting, short-circuiting, exception propagation, cancellation, timeout, concurrent executions and context isolation. Provide deterministic fake clock and test stages.

## Dependencies / versioning

Runtime-neutral root. Nest/Worker/testing are isolated subpaths. Public interface changes are semver-governed.

## Phases

1. Contracts/scaffold (1d); 2. Builder/executor (2d); 3. cancellation/timeouts (1d); 4. Nest/Worker adapters (2d); 5. discovery/registry (1d); 6. tests/observability/security (2d); 7. docs/release (1d).

## Exit criteria

Deterministic ordered execution, safe cancellation, bounded resources, isolated contexts and complete contract/conformance coverage.

## Cross-references

`2026-09-03-http-package.md`, `2026-09-03-events-package.md`, `2026-09-03-errors-package.md`, ADR-0090/0091/0092.
