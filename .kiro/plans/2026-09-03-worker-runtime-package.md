---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/worker` — Cloudflare Worker runtime adapter

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0021, ADR-0022, ADR-0083, ADR-0088, ADR-0091, ADR-0092  
**Depends on:** `@stackra/container`, `@stackra/config`, `@stackra/logger`, `@stackra/errors`, `@stackra/storage`, `@stackra/database`, `@stackra/queue`, `@stackra/nats`  
**Design effort:** 20 days across 9 phases

## Purpose

Cloudflare Worker execution boundary with explicit Wrangler env bindings, per-request DI/context, R2/KV/D1 adapters, queue consumers, Durable Objects integration, `ExecutionContext.waitUntil()` handling and graceful request-scoped cleanup.

## Non-goals

Node process APIs, long-lived process-global state, local filesystem, or NestJS bootstrapping inside core Worker code.

## Manager pattern

No runtime manager. `WorkerRuntimeFactory` creates request-scoped execution containers and binds platform capabilities.

## Subpath layout

```text
packages/worker/src/core/{runtime.module.ts,bindings/,request/,lifecycle/,index.ts}
packages/worker/src/worker/{fetch/,queues/,durable-objects/,r2/,kv/,d1/,waituntil/,health/,index.ts}
packages/worker/src/testing/{miniflare-fixture.ts,bindings.ts,index.ts}
```

## Contracts / API

Locked exports: `WorkerRuntimeFactory`, `createWorkerHandler`, `WorkerRequestContext`, `WorkerBindings`, `waitUntil`, `WorkerModule`.

Each request gets an isolated container/context. Bindings are explicit typed dependencies. `waitUntil` work is bounded, observable and never used as a substitute for durable queues.

## Security

Validate origin, auth, tenant context and binding configuration at the boundary. No secret is read from source files. SSRF and arbitrary URL fetches are controlled by allowlists. R2 object keys and KV keys are tenant-safe.

## Errors / observability / persistence

Worker exceptions become safe Responses through `@stackra/errors`. Metrics/logs are structured and request-correlated. D1/Queue/R2 operations are explicit adapters; migrations are separate deployment steps.

## Testing

Use `@cloudflare/vitest-pool-workers`/Miniflare for real runtime semantics. Test request isolation, waitUntil, queue batches, binding absence, D1 transactions, R2 access, Durable Object routing and cold-start behavior.

## Phases

1. contracts/scaffold (2d); 2. bindings/request context (3d); 3. fetch/error lifecycle (2d); 4. storage/database adapters (3d); 5. queues/DOs (3d); 6. security/tenant isolation (2d); 7. observability/recovery (2d); 8. runtime conformance (2d); 9. docs/release (1d).

## Exit criteria

No process-global mutable assumption, explicit binding contracts, real Worker runtime tests, bounded waitUntil work and deterministic tenant/request isolation.

## Cross-references

`2026-09-03-node-runtime-package.md`, `2026-09-03-storage-package.md`, `2026-09-03-queue-package.md`, `2026-09-03-nats-package.md`, ADR-0083/0088/0091/0092.
