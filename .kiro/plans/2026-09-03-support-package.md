---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://support-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/support` — foundation utilities

**Status:** Planned (already USED by `@stackra/testing`; needs plan of record)
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md)
**Reference:** `.ref/packages/support/` (`@stackra/ts-support` v0.1.0) **Depends
on:** ZERO runtime dependencies (foundation tier) **Design effort:** 12 days
across 5 phases

## Purpose

The workspace's ONE utility layer — every `@stackra/*` package composes from it.
Ships Laravel-Support-inspired primitives (Str/Arr/Num/Env), BaseRegistry +
Manager patterns (used by every driver-based package per ADR-0090), and
cross-runtime helpers (Sleep/Retry/Timebox/Pipeline).

Zero runtime deps. Every symbol usable in browser, RN, Worker, Node. No platform
detection — every helper is either pure JS OR guards on the presence of a global
(`typeof window`).

## Rules `@stackra/support` MUST follow

1. **Zero runtime deps** — `package.json.dependencies === {}`. Every dep is
   dev-only.
2. **Zero framework coupling** — no `@stackra/container`, no NestJS, no React.
   This is what OTHER packages import; it depends on nothing.
3. **Zero side effects** — `sideEffects: false`. Tree-shakable per-symbol.
4. **Cross-runtime by construction** — every helper works in browser + RN +
   Worker + Node without conditional imports.
5. **Locked API surface** — once shipped, adding is fine; renaming is a breaking
   change requiring a major bump + 90-day deprecation.

## Public API — locked

Every symbol is exported from the root barrel. No subpath splits (the API is
small enough that every consumer treats it as one bag).

### String utilities — `Str`

Static class with Laravel-Str-inspired methods:

- `Str.slug(input, delimiter?)` — URL-safe slug.
- `Str.random(length?)` — cryptographically-secure random string.
- `Str.uuid()` — RFC-4122 v4 UUID.
- `Str.ulid()` — Crockford base32 ULID (proxies to `ulid` package — the only
  supported optional peer for this method).
- `Str.camel(s)`, `Str.snake(s, delimiter?)`, `Str.kebab(s)`, `Str.studly(s)` —
  case conversions.
- `Str.startsWith(s, needle)`, `Str.endsWith(s, needle)`,
  `Str.contains(s, needle)`.
- `Str.limit(s, length, suffix?)` — truncate w/ suffix.
- `Str.length(s)` — Unicode-aware length.
- `Str.padLeft(s, length, char?)`, `Str.padRight(s, length, char?)`.

### Array utilities — `Arr`

- `Arr.wrap(v)` — ensures value is an array.
- `Arr.pluck(array, key)` — extract property from each object.
- `Arr.chunk(array, size)` — split into fixed-size chunks.
- `Arr.groupBy(array, keyOrFn)` — group by key or function result.
- `Arr.unique(array, keyOrFn?)` — dedupe.
- `Arr.flatten(array, depth?)` — recursive flatten.
- `Arr.random(array, count?)` — random sample.

### Number utilities — `Num`

- `Num.clamp(n, min, max)`.
- `Num.random(min, max)` — inclusive-exclusive uniform.
- `Num.round(n, precision?)`.
- `Num.percentage(n, decimals?)` — formats as `"12.34%"`.
- `Num.bytes(n, decimals?)` — formats as `"1.23 MB"`.
- `Num.currency(n, currency?, locale?)` — Intl.NumberFormat wrapper.

### Env utilities — `Env`

- `Env.get(key, default?)` — reads `process.env` OR `import.meta.env` OR Worker
  `env` (via injected shim). Type-aware defaults.
- `Env.getRequired(key)` — throws if missing.
- `Env.getBoolean(key, default?)` — parses `"true"` / `"1"` / `"yes"`.
- `Env.getNumber(key, default?)`.
- `Env.getJson<T>(key, default?)` — parses JSON w/ fallback.
- `Env.isProduction()`, `Env.isDevelopment()`, `Env.isTest()`.

### `BaseRegistry<K, V>` — Map-with-events

The base for every registry across the workspace (ZoneRegistry, CommandRegistry,
FeatureRegistry, ...). Provides:

- `.register(key, value)` w/ collision detection.
- `.replace(key, value)` w/ event fire.
- `.remove(key)` w/ event fire.
- `.get(key)`, `.has(key)`, `.all()`, `.keys()`, `.values()`.
- `.subscribe(handler)` — every mutation notifies handlers.
- `.clear()`.

### `Manager<T>` — single-driver Shape A (ADR-0090)

```typescript
abstract class Manager<T> {
  protected abstract getDefaultDriver(): string;
  driver(name?: string): T; // cached lookup; name defaults to getDefaultDriver()
  extend(name: string, creator: () => T): void;
  // Sub-classes implement create<Studly>Driver() methods per Str.studly.
}
```

### `MultipleInstanceManager<T>` — multi-instance Shape B (ADR-0090)

```typescript
abstract class MultipleInstanceManager<T> {
  protected abstract getDefaultInstance(): string;
  protected abstract getInstanceConfig(name: string): {
    driver: string;
    [k: string]: any;
  };
  instance(name?: string): T;
  extend(driver: string, creator: (config) => T): void;
  setDefaultInstance(name: string): void;
}
```

### Control-flow helpers

- `sleep(ms)` — `Promise<void>`.
- `retry(fn, options)` — with `attempts`, `initialDelay`, `factor`, `maxDelay`,
  `onRetry?`. Supports exponential backoff w/ jitter.
- `timebox(fn, ms)` — races against a timeout; rejects w/ `TimeboxError`.
- `once(fn)` — memoise for the lifetime of the process.
- `tap(value, fn)` — side-effect then return.
- `optional(v)` — `Optional<T>` monad (`.map`, `.orElse`, `.get`).
- `pipeline(input).pipe(fn1).pipe(fn2).run()` — functional pipeline w/
  cancellation.

### Data helpers

- `Collection<T>` — Laravel-Collection-inspired w/ `.filter`, `.map`, `.reduce`,
  `.first`, `.last`, `.pluck`, `.groupBy`, `.chunk`, etc. Chainable.
- `Fluent<T>` — dot-notation getter/setter over an object.
- `HtmlString` — mark strings as HTML-safe.
- `Conditionable<T>` — mixin w/ `.when(cond).then(...)` chains.
- `Macroable` — dynamic method extension mixin.
- `Benchmark.run(name, fn)` — timing helper.

## Subpath layout

Single-entry package. Every export via root barrel.

```
packages/support/
├── package.json                          # single "." export
├── catalog.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts                          # barrel re-exports every symbol
│   ├── arr.ts
│   ├── base-registry.ts
│   ├── benchmark.ts
│   ├── collection.ts
│   ├── conditionable.ts
│   ├── env.ts
│   ├── file.ts                           # file-path helpers (path.join, etc.)
│   ├── fluent.ts
│   ├── html-string.ts
│   ├── macroable.ts
│   ├── managers/
│   │   ├── manager.ts                    # Manager<T>
│   │   ├── multiple-instance-manager.ts  # MultipleInstanceManager<T>
│   │   └── index.ts
│   ├── num.ts
│   ├── once.ts
│   ├── optional.ts
│   ├── pipeline.ts
│   ├── retry.ts
│   ├── sleep.ts
│   ├── str.ts
│   ├── tap.ts
│   ├── timebox.ts
│   └── uri.ts                            # URI-parsing helpers
└── __tests__/
    └── unit/                             # one test file per symbol
```

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton per `.kiro/steering/package-conventions.md`.
- [ ] Zero-dep verification (`pnpm install`; `dependencies` is `{}`).

### Phase 2 — Core primitives (4 days)

- [ ] `Str`, `Arr`, `Num`, `Env` — the four static helpers.
- [ ] Collection, Fluent, HtmlString, Conditionable, Macroable.
- [ ] URI parser w/ browser + Node parity.

### Phase 3 — Manager patterns (2 days)

- [ ] `BaseRegistry<K, V>` w/ event bus.
- [ ] `Manager<T>` — Shape A per ADR-0090.
- [ ] `MultipleInstanceManager<T>` — Shape B per ADR-0090.
- [ ] `Str.studly` invocation contract locked (both managers use it).

### Phase 4 — Control-flow helpers (2 days)

- [ ] `sleep`, `retry`, `timebox`, `once`, `tap`, `optional`, `pipeline`.
- [ ] `retry` supports jitter modes (`full` / `equal` / `decorrelated`).

### Phase 5 — Testing + docs (3 days)

- [ ] Unit test per symbol (30+ files) — 95% branch coverage.
- [ ] README documents every symbol w/ a copy-pasteable example.
- [ ] Verify tree-shaking — importing `Str.slug` alone shouldn't pull `Arr` /
      `Num`.

## Exit criteria

- [ ] Zero runtime deps.
- [ ] `sideEffects: false` verified in built output.
- [ ] 95% branch coverage.
- [ ] Every symbol works in browser + RN + Worker + Node (verified via
      cross-runtime test).
- [ ] `@stackra/testing` continues to build (it imports from here).

## Cross-refs

- ADR-0090, 0091.
- `.ref/packages/support/` — reference implementation.
- Every heavy-tier package composes from here.
