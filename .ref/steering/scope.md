# Scope platform — rules of engagement

Every HTTP-visible surface, every CLI/script that touches tenant data, every
repository read, and every use-case handler MUST operate under an active scope
context. This file pins the rules that keep the contract intact across every
module.

## What "scope" is

`@stackra/scope` is the framework-tier hierarchical scope platform. Four tables
(`scope_definitions`, `scope_nodes`, `scope_values`, `scope_aliases`) in
Supabase, one resolver chain, N consumer namespaces. See the package README for
the full model.

Every module that owns configuration (settings, permissions, feature flags,
pricing, notification preferences, ...) registers a namespace with the scope
registry (`ScopeRegistry.consumer(...)`) and stores its values through the
resolver — never with a bespoke table.

## The hard rules

### 1. Middleware coverage

Every `/api/v1/...` Worker route MUST run through the `scope` middleware. The
router applies it by default; do not opt out without a `bypassScope`
justification on every affected handler.

### 2. `scope.current()` in reads

Any read that varies by scope calls `scope.current()` (nullable) or
`scope.currentOrFail()` (throws). Both come from the request-scoped `Scope`
service resolved via the container — NEVER thread `ScopeContext` through
deeply-nested constructors just to read the current node. The service is
request-scoped, so reading it near the call site is correct.

### 3. `scopedBy` on tenant-owned rows

Any table that carries a `scope_node_id` column MUST have its repository apply
the ancestor-chain scope filter (declared via `scopedBy` metadata on the model
/ repository). The scope-aware query builder enforces ancestor-chain filtering
on every query.

### 4. Explicit `bypassScope` for every cross-scope read

Explicit + reviewable. Every function that legitimately reads across scopes
(audit reports, GDPR erasure, support impersonation) is annotated
`bypassScope({ reason: "<explanation>", adrRef: "ADR-XXXX" })` AND opts out of
the ancestor-chain filter inside (`.withoutScope()` on the query). Both are
required — the annotation is the "why", the query flag is the "how". Missing
either is a review-blocking finding.

### 5. Consumer namespaces

Every namespace MUST be lowercase, alphanumeric + underscores, starting with a
letter, 1-64 chars. The registry enforces this with a regex; the steering
enforces the semantics: pick a descriptive slug (`settings`, `feature_flags`,
`pricing`), not a generic one (`config`, `values`).

### 6. Service over deep injection

Prefer `scope.current()` / `scope.resolve(...)` at call sites via the injected
`Scope` service. Only inject the lower-level `ScopeContext` / `ScopeResolution`
interfaces directly when a unit test needs to swap the implementation for a
fake. The container resolves a fake in tests via a provider override.

### 7. Background work captures context at enqueue

Any queued job / async task whose behaviour depends on scope MUST capture the
active `ScopeContext` snapshot at enqueue time and re-establish it via
`scope.runIn(...)` when the task runs. Enqueuing without the capture reads NO
context on the worker side and fails the strict middleware check.

```ts
// Enqueue
const context = scope.currentOrFail();
await queue.dispatch(new DispatchInvoiceEmailJob(invoiceId, context));

// Handle
async handle(): Promise<void> {
  await scope.runIn(this.context, async () => {
    // job body — reads see the same scope the enqueuer had
  });
}
```

### 8. CLI / scripts opt-in explicitly

CLI commands and scripts do NOT get the `scope` middleware — they run outside
the HTTP request. A command that touches tenant data either:

- Accepts a `--scope-node-id=<ulid>` flag and calls `scope.runInNode(...)`
  before doing work, OR
- Iterates every owner's root and does the work per-scope (typical for cron
  jobs), OR
- Is annotated `bypassScope` on its handler and explicitly documents the
  rationale.

## Anti-patterns

- ❌ Reading `scope.current()` from a model/DB event hook without first
  confirming the row is loaded inside a middleware-wrapped request. Seed +
  factory paths fire where no context exists.
- ❌ Writing to `scope_values` directly through the DB client. Every write goes
  through `scope.write(...)` so the consumer's validator runs.
- ❌ Introducing a new hierarchy level in code (a hardcoded "team" concept). New
  levels are `scope_definitions` rows, seeded per deployment.
- ❌ Using request cookies/session for scope state. Token-based auth doesn't
  carry server session, and session state doesn't survive queue workers.

## Related steering

- `conventions.md` — docblocks + strict types + explicit return types apply to
  every file in this package too.
- `communication-patterns.md` — DI is how consumers reach the `Scope` service;
  context is request-scoped, not global.
- `tenancy-columns.md` — the three-axis attribution contract every scoped row
  also satisfies.
