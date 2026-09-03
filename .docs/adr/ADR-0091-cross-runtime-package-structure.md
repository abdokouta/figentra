---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://workspace-standardization
reviewed_by: null
reviewed_at: null
---

# ADR-0091 — Cross-runtime package structure

**Status:** Accepted **Date:** 2026-09-03 **Supersedes:** — **Superseded by:** —

## Context

Several `@stackra/*` packages need to ship the SAME domain concept — the same
service, hook, i18n catalogue, or context — across MULTIPLE runtimes at once:

| Package                     | Web (React)         | React Native   | Cloudflare Worker | NestJS server   |
| --------------------------- | ------------------- | -------------- | ----------------- | --------------- |
| `@stackra/container`        | Browser DI + hooks  | RN DI + hooks  | Worker DI         | Nest DI adapter |
| `@stackra/logger`           | Console + HTTP sink | Console + HTTP | Worker console    | Pino / Winston  |
| `@stackra/i18n`             | Catalog hooks       | Catalog hooks  | —                 | Middleware      |
| `@stackra/auth-ui`          | Login form UI       | Login form UI  | —                 | —               |
| `@stackra/notifications-ui` | Toast host          | Push renderer  | —                 | —               |

The naive shape — one package per runtime (`@stackra/logger-react`,
`@stackra/logger-native`, `@stackra/logger-worker`, `@stackra/logger-nest`) —
explodes the workspace into 4× the packages, forces every consumer to pick a
different install command per platform, and lets the versions drift.

The proven shape — one package with N subpath exports — is what
`@stackra/container` and `@stackra/logger` already used in their previous
lifetime (per `.ref/packages/container` and `.ref/packages/logger`). But there
was no ADR pinning the rule: which subpaths, in which order, with which peer
deps, with which cross-cutting types.

Two coexistence problems recur:

1. **Cross-runtime types + tokens.** `ILogger`, `LOGGER`, `IContainerResolver`
   must be importable from every runtime without pulling in that runtime's
   implementation.
2. **Cross-runtime code that IS runtime-agnostic.** A `useLogger()` hook or an
   English `login.title` string should be authored ONCE and consumed by both
   `/react` and `/native` (React + React Native both understand hooks; both
   understand JSON i18n catalogs).

## Decision

**Every cross-runtime `@stackra/*` package follows a fixed subpath layout, with
runtime-agnostic code hoisted to `src/core/` and runtime-specific code isolated
under `src/<runtime>/`. Pure interfaces + tokens live in `@stackra/contracts`
instead of the package.**

### The canonical subpath set

| Subpath                         | `package.json` export | Content                                                                                                |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `@stackra/<pkg>`                | `.`                   | Runtime-agnostic core: services, factories, non-DI-bound managers, pure utils. Safe for every runtime. |
| `@stackra/<pkg>/nestjs`         | `./nestjs`            | NestJS `DynamicModule` + Nest-specific services, middleware, interceptors, filters, health indicators. |
| `@stackra/<pkg>/react`          | `./react`             | React-only providers, hooks, components. DOM-safe.                                                     |
| `@stackra/<pkg>/native`         | `./native`            | React Native providers, hooks, components. RN-safe.                                                    |
| `@stackra/<pkg>/worker`         | `./worker`            | Cloudflare Worker module + env-binding integration + `ExecutionContext.waitUntil` hooks.               |
| `@stackra/<pkg>/pino`           | `./pino`              | Optional Pino driver (logger only).                                                                    |
| `@stackra/<pkg>/winston`        | `./winston`           | Optional Winston driver (logger only).                                                                 |
| `@stackra/<pkg>/testing`        | `./testing`           | In-memory / mock implementations of the package's core.                                                |
| `@stackra/<pkg>/testing/react`  | `./testing/react`     | React-specific test helpers (renders provider, mocks).                                                 |
| `@stackra/<pkg>/testing/worker` | `./testing/worker`    | Worker-specific test helpers (Miniflare + env stub).                                                   |

The set is a MENU — most packages ship a subset. `@stackra/logger` ships every
row. `@stackra/i18n` ships root + `/nestjs` + `/react` + `/native` + `/testing`
only.

### Directory layout (locked)

```
packages/<pkg>/
├── src/
│   ├── core/                          # runtime-agnostic
│   │   ├── contexts/                  # createContext() calls — cross-platform
│   │   ├── hooks/                     # pure React hooks used by both /react and /native
│   │   ├── providers/                 # cross-platform provider factories (JSX only)
│   │   ├── services/                  # framework-agnostic classes (Managers, factories)
│   │   ├── interfaces/                # local (non-exported) interfaces
│   │   ├── i18n/                      # en.json + ar.json + shared JSON catalogues
│   │   ├── utils/
│   │   ├── constants/
│   │   └── index.ts                   # root barrel — public API
│   │
│   ├── nestjs/
│   │   ├── <pkg>.module.ts            # DynamicModule.forRoot + forRootAsync
│   │   ├── services/                  # Nest-specific (RequestContext, AsyncLocalStorage)
│   │   ├── middleware/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── health/
│   │   └── index.ts                   # ./nestjs barrel
│   │
│   ├── react/
│   │   ├── providers/                 # web-only DOM providers (portals, mutation observers)
│   │   ├── hooks/                     # web-only (window, document, DOM APIs)
│   │   ├── components/
│   │   └── index.ts                   # ./react barrel — re-exports core/{hooks,providers,contexts} + web-only
│   │
│   ├── native/
│   │   ├── providers/                 # RN-only (LinkingProvider, AppStateProvider)
│   │   ├── hooks/                     # RN-only (uses react-native APIs)
│   │   ├── components/
│   │   └── index.ts                   # ./native barrel — re-exports core/{hooks,providers,contexts} + RN-only
│   │
│   ├── worker/
│   │   ├── <pkg>.module.ts            # WorkerModule builder / factory
│   │   ├── env-bindings.ts            # Cloudflare env type + binding wire-up
│   │   ├── request-context.ts        # per-request context (AsyncLocalStorage-lite)
│   │   ├── waituntil-flush.ts        # flush hook for ctx.waitUntil()
│   │   └── index.ts                   # ./worker barrel
│   │
│   ├── pino/                          # optional — only if the package ships a Pino driver
│   ├── winston/                       # optional
│   │
│   └── testing/
│       ├── mock-<pkg>.ts
│       ├── in-memory-<pkg>.ts
│       ├── react/                    # optional — React-specific mounts
│       ├── worker/                   # optional — Miniflare-based helpers
│       └── index.ts
│
├── __tests__/                         # Vitest suite — one file per public API
├── LICENSE
├── README.md                          # subpath-by-subpath usage guide
├── catalog.json                       # workspace manifest
├── package.json                       # subpath exports + optional peers
├── tsconfig.json
├── tsup.config.ts                     # one entry per subpath
└── vitest.config.ts                   # merges @stackra/testing/preset
```

### Rule 1 — Contracts owns the shared vocabulary

Every symbol that MUST be importable across runtime boundaries without pulling
in a runtime implementation lives in `@stackra/contracts`:

| Category             | Example                                                             |
| -------------------- | ------------------------------------------------------------------- |
| Interfaces           | `ILogger`, `ICacheStore`, `IContainerResolver`, `IDiscoveryService` |
| Injection tokens     | `LOGGER`, `LOGGER_MANAGER`, `CACHE_MANAGER`, `CONTAINER`            |
| Public enums         | `LogLevel`, `Scope`, `SortDirection`                                |
| Public error classes | `ContainerResolutionError`, `LoggerConfigError`                     |
| Shared DTO types     | `ILogEntry`, `ICacheOptions`, `IHealthReport`                       |

`@stackra/contracts` has ZERO runtime deps. It's the workspace's shared
vocabulary. Every driver-based `@stackra/*` package + every consuming app
imports from it. Concrete driver classes NEVER live there.

### Rule 2 — `src/core/` is runtime-agnostic

Every file under `src/core/` MUST be importable from every runtime without
error. That means:

- No `window`, `document`, `localStorage`, `fetch` (browser-specific).
- No `require('fs')`, `require('path')`, `process.env` (Node-specific).
- No `import 'react-native'` (RN-specific).
- No `import { defineWorkerRoute } ...` (Worker-specific).
- Pure React hooks + contexts + JSX are ALLOWED under `core/` when they're
  cross-compatible with both React DOM and React Native (a `useContext` +
  `useState` hook is fine; `useSyncExternalStore(subscribeToScroll)` is not).

Reviewers check: `core/` code must build cleanly under a `tsup` entry with NO
DOM-lib types.

### Rule 3 — Shared hooks/contexts/providers hoist to `core/`

The most common coexistence pattern: a React hook that BOTH `/react` and
`/native` need. Solution: hoist to `src/core/hooks/`. Both barrels re-export
from `../core`.

```typescript
// packages/logger/src/core/hooks/use-logger.hook.ts
import { useContext } from "react";
import { LoggerContext } from "../contexts";
import type { ILogger } from "@stackra/contracts";

/**
 * Retrieves the currently-scoped logger from context.
 * Works identically under React DOM and React Native.
 */
export function useLogger(): ILogger {
  const logger = useContext(LoggerContext);
  if (!logger) throw new Error("useLogger: no <LoggerProvider>");
  return logger;
}
```

```typescript
// packages/logger/src/react/index.ts
export * from "../core/hooks"; // useLogger, useLogChannel, useRequestLogger
export * from "../core/providers"; // <LoggerProvider>
export * from "../core/contexts"; // LoggerContext (advanced)

// Web-only additions
export { HttpSinkProvider } from "./providers/http-sink-provider";
export { useNetworkCapture } from "./hooks/use-network-capture";
```

```typescript
// packages/logger/src/native/index.ts
export * from "../core/hooks"; // same hooks, same behaviour
export * from "../core/providers";
export * from "../core/contexts";

// RN-only additions
export { NativeSinkProvider } from "./providers/native-sink-provider";
export { useAppStateLogger } from "./hooks/use-app-state-logger";
```

### Rule 4 — Shared i18n catalogues live at `src/core/i18n/`

Every user-facing string ships as JSON. The i18n runtime works identically on
React DOM and React Native (both consume `t("key")` from the same catalogue). So
one catalogue per package, at `src/core/i18n/en.json` + `ar.json`. The
`@stackra/i18n` runtime picks them up via convention.

```
packages/auth-ui/src/core/i18n/
├── en.json      # {"login": {"title": "Sign in", "submit": "Continue"}}
└── ar.json      # {"login": {"title": "تسجيل الدخول", "submit": "متابعة"}}
```

Runtime-specific string overrides (RN uses different accessibility label
conventions than DOM) fold in via `src/react/i18n/*.json` +
`src/native/i18n/*.json` which are LAYERED on top of `core/` at load time.
Optional; most packages don't need it.

### Rule 5 — Runtime-specific hooks stay in their subpath

If a hook uses a runtime-specific API, it MUST live in that runtime's subpath:

| Hook uses...                          | Home                       |
| ------------------------------------- | -------------------------- |
| `useEffect + window.addEventListener` | `src/react/hooks/`         |
| `useEffect + AppState (RN)`           | `src/native/hooks/`        |
| Cloudflare `env.KV`                   | `src/worker/hooks/` (rare) |
| NestJS `@Inject()` decorator          | `src/nestjs/services/`     |

Do not hoist a runtime-specific hook to `core/` even if "we might share it
later". Move it when the second consumer arrives.

### Rule 6 — Subpath dependency direction is one-way and top-down

```text
                     src/core/  (bottom — no upward imports)
                          │
      ┌───────────────────┼────────────────────┐
      ▼                   ▼                    ▼
  src/react/          src/native/          src/nestjs/
      │                   │                    │
      └───────────────────┼────────────────────┘
                          ▼
                     src/worker/
                          │
                          ▼
                     src/testing/  (top — imports from everything)
```

Rules:

- `core/` NEVER imports from `react/`, `native/`, `nestjs/`, `worker/`,
  `testing/`.
- `react/` and `native/` MAY import from `core/`. They MUST NOT import each
  other.
- `nestjs/` MAY import from `core/`. It MUST NOT import from `react/`,
  `native/`, or `worker/`.
- `worker/` MAY import from `core/` and optionally from `nestjs/` for the
  Nest-in-Worker adapter (Ora, `nest-cf-workers-router`, etc.). It MUST NOT
  import from `react/` or `native/`.
- `testing/` MAY import from any subpath — it's the highest tier.

Reviewers enforce with a per-package script that scans imports and rejects
upward or cross-runtime paths.

### Rule 7 — Runtime deps are always optional peers

`package.json` for every cross-runtime package:

```jsonc
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:*",
    "@stackra/support": "workspace:*",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-native": "^0.82.0",
    "pino": "^9.0.0",
    "winston": "^3.13.0",
  },
  "peerDependenciesMeta": {
    "@nestjs/common": { "optional": true },
    "@nestjs/core": { "optional": true },
    "react": { "optional": true },
    "react-dom": { "optional": true },
    "react-native": { "optional": true },
    "pino": { "optional": true },
    "winston": { "optional": true },
  },
}
```

Only `@stackra/contracts` (and, for driver-based packages, `@stackra/support`)
is required. Everything else is optional; consumers install what they use.

### Rule 8 — One `tsup.config.ts`, one entry per subpath

Every subpath declared in `package.json` `exports` has a matching entry in
`tsup.config.ts` under `entry:`. The build produces
`dist/<subpath>/index.{js,mjs,d.ts}` per entry.

Consumers `import { X } from "@stackra/<pkg>/react"` → resolves to
`dist/react/index.mjs` via the `exports` map.

### Rule 9 — `package.json` `exports` map (canonical shape)

```json
{
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.mjs",
      "require": "./dist/core/index.js"
    },
    "./nestjs": {
      "types": "./dist/nestjs/index.d.ts",
      "import": "./dist/nestjs/index.mjs",
      "require": "./dist/nestjs/index.js"
    },
    "./react": { "…": "…" },
    "./native": { "…": "…" },
    "./worker": { "…": "…" },
    "./testing": { "…": "…" },
    "./package.json": "./package.json"
  }
}
```

`package.json` MUST be exported explicitly to keep tools like
`@nestjs/microservices` and pnpm's `postinstall` scripts happy.

## Rationale

- **One package = one domain concept.** Publishing `@stackra/logger-react` and
  `@stackra/logger-native` separately is a maintenance loss — version drift,
  duplicated changelogs, N-times PR cost.
- **The subpath boundary is what tree-shakes.** A Cloudflare Worker consumer
  importing `@stackra/logger/worker` never pulls in Pino or React. A React app
  importing `@stackra/logger/react` never pulls in NestJS.
- **`core/` is the shared authoring surface.** Two runtimes share a hook →
  authored once, tested once, versioned once. Contracts owns the interface.
- **Optional peers make the package portable.** A CLI script that just wants
  `Logger.create()` from the `core/` entry doesn't need Nest/React/RN installed.
- **The layout matches what `.ref/packages/container` + `.ref/packages/logger`
  already used.** The ADR pins the rule so future packages don't drift.

## Alternatives considered

### Alternative 1 — One package per runtime

`@stackra/logger`, `@stackra/logger-react`, `@stackra/logger-native`,
`@stackra/logger-worker`, `@stackra/logger-nest`.

**Rejected because:**

- 5× the workspace packages for the same domain concept.
- Version drift across runtimes on the same feature.
- Every changeset touches N packages.
- Shared code (interfaces, common hooks) either duplicates or spawns a further
  `@stackra/logger-core` package.

### Alternative 2 — Runtime detection at runtime

Ship one entry, use `typeof window`, `typeof globalThis.WorkerGlobalScope`, and
`typeof process.versions.node` at boot to pick behaviour.

**Rejected because:**

- Bundler cannot tree-shake — RN app ships Pino + Winston in its bundle
  regardless.
- SSR mismatches (SSR renders the "server" branch even on a "client" import).
- Debugging is hell.

### Alternative 3 — Conditional exports on `browser` / `node` / `worker`

Use the `exports` map's runtime conditions:

```json
{
  "exports": {
    ".": {
      "browser": "./dist/browser.mjs",
      "worker": "./dist/worker.mjs",
      "node": "./dist/node.mjs"
    }
  }
}
```

**Rejected because:**

- Conditional exports are the LOWEST-LEVEL selector; workspace convention is
  explicit subpaths, which map 1:1 to `pnpm --filter` + docs + IDE auto-imports.
- Doesn't scope by USE (React vs NestJS both run in Node); scopes by RUNTIME.
- Nest-in-Worker + Nest-on-Node fight over the same `node` condition.

### Alternative 4 — Monorepo of source, ESM subpath imports from monolithic `dist/`

Ship one giant `dist/index.mjs`, mark subpaths as re-exports.

**Rejected because:**

- Consumers ship the whole bundle regardless of subpath imported.
- Nest server ships React and RN and Cloudflare types.
- Same tree-shaking failure mode as Alternative 2.

## Consequences

### Positive

- One workspace package per domain concept, N runtimes served from it.
- Tree-shaking works: consumer bundle carries only its subpath's runtime deps.
- One README + one CHANGELOG + one version + one release cadence per package.
- `@stackra/contracts` becomes the workspace's shared vocabulary; every package
  imports from it, and NO package re-exports from it (per ADR — see
  `.kiro/steering/contract-reexports.md`).
- Cross-runtime shared code (hooks, i18n) has an unambiguous home: `core/`.

### Negative

- Package folder layout is fixed and verbose (7+ subfolders even for small
  packages). Reviewers must enforce.
- Subpath dependency direction is a constant grep target (every merge checks no
  upward import).
- `tsup.config.ts` grows linearly with subpath count.

### Neutral

- Nine subpaths is the ceiling; `@stackra/logger` uses every one. Most packages
  ship 3-5.
- Testing subpaths (`testing/react`, `testing/worker`) are optional; ship only
  when the consuming test file exists.

## Enforcement

Reviewers verify per-package:

1. `package.json` `exports` and `tsup.config.ts` `entry` maps match 1:1.
2. Every subpath listed under `catalog.json` `surfaces` matches an `exports`
   entry.
3. `src/core/` has no import from `src/{react,native,nestjs,worker,testing}/`.
4. `src/react/` has no import from `src/native/` (and vice versa).
5. Every user-facing string lives at `src/core/i18n/*.json` (unless
   runtime-specific per Rule 4).
6. Cross-package interfaces live in `@stackra/contracts`; no `I*Like` shim.
7. Every runtime peer is OPTIONAL in `peerDependenciesMeta`.
8. `package.json` exports `./package.json` (required by pnpm/postinstall
   tooling).

## Cross-references

- ADR-0090 — Manager + MultipleInstanceManager pattern (paired rule for
  driver-based packages).
- ADR-0092 — Service auto-registration (imports LoggerModule etc. from the
  `/nestjs` subpath).
- `.kiro/steering/subpath-layering.md` (frontend) — pre-existing rule for the
  frontend surface; this ADR generalises it to every runtime.
- `.kiro/steering/contract-reexports.md` — never re-export from
  `@stackra/contracts`.
- `.kiro/steering/frontend-localization.md` — the i18n catalogue rule this ADR
  extends to cross-runtime packages.
- `.kiro/plans/2026-09-03-container-package.md` — first consumer.
- `.kiro/plans/2026-09-03-logger-package.md` — first consumer (with `/pino` +
  `/winston` optional subpaths).
- `.ref/packages/container/stackra-container-architecture-plan.md` §33-40 —
  reference implementation.
- `.ref/packages/logger/stackra-logger-architecture-plan.md` §94-97 — reference
  implementation.
