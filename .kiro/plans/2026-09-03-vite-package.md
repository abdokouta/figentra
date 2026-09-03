---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://vite-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/vite` — Vite config orchestrator

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md)
**Reference:** `.ref/packages/vite/` **Depends on:** `@stackra/support` (Str),
`@stackra/contracts` (light); `vite` is a required peer. **Design effort:** 8
days across 5 phases

## Purpose

Neutral Vite-config orchestrator. Ships a typed `defineConfig(...)` helper +
plugin-map envelope. **Deliberately NOT a plugin registry with built-ins** —
consumers bring their own plugin factories from the third-party packages they
depend on. This package composes them.

The plugin-map envelope solves three problems consuming apps face:

1. **Every plugin optional.** Each entry is `{ enabled, factory, options }` so
   apps toggle features via env / flag.
2. **Merge-friendly.** Multiple envelopes merge deterministically w/ key-level
   overrides.
3. **Type-safe.** Every entry carries a typed `options` shape mapped to the
   plugin's exported `options` type.

## Non-goals

- Vite plugins themselves. `@stackra/i18n/vite`, `@stackra/config/vite`,
  `@stackra/testing/vite` (if any) — those ship in their owning packages. This
  package just ORCHESTRATES.
- Framework opinions (React vs Vue vs Svelte) — the orchestrator is framework-
  neutral.
- Bundle analysis, HMR customisation — pass-through to Vite.

## Public API — locked

### `defineConfig(input)`

Wraps Vite's `defineConfig` w/ the workspace's shared defaults:

```typescript
import { defineConfig } from "@stackra/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: { port: 3000 },
  build: { target: "es2022" },
  plugins: {
    react: {
      enabled: true,
      factory: react,
      options: { jsxRuntime: "automatic" },
    },
    tsconfigPaths: { enabled: true, factory: tsconfigPaths, options: {} },
    "config-inline": {
      enabled: process.env.APP_ENV !== "test",
      factory: async () => (await import("@stackra/config/vite")).default,
      options: { schemaGlob: "packages/*/src/core/config/schema.ts" },
    },
  },
});
```

Returns a Vite `UserConfig` — every consuming project's `vite.config.ts` does
`export default defineConfig({...})`.

### `mergeConfigs(...configs)`

Deep-merge two or more envelopes. Right-most wins on collisions. Preserves
plugin-map semantics (a disabled plugin on the left stays disabled unless
overridden explicitly on the right).

```typescript
import base from "./vite.base.config";
import overrides from "./vite.prod.overrides";
export default mergeConfigs(base, overrides);
```

### `pluginMap<T>(entries)`

Type-safe helper for the plugin-map envelope. Auto-infers the factory's options
type:

```typescript
const plugins = pluginMap({
  react: { enabled: true, factory: react, options: {/* auto-typed */} },
});
```

### `WorkspaceEnv` — env-var reader

Wraps `import.meta.env` w/ typed accessors. Fails fast on missing required keys
at Vite build time (not at runtime):

```typescript
import { WorkspaceEnv } from "@stackra/vite/env";
const env = WorkspaceEnv.parse(process.env, {
  APP_URL: z.string().url(),
  APP_ENV: z.enum(["dev", "stg", "prd"]),
});
// env.APP_URL is typed as string
```

## Subpath layout

```
packages/vite/
├── package.json                          # 3 subpath exports
├── src/
│   ├── core/                             # ".": Vite orchestrator
│   │   ├── define-config.ts
│   │   ├── merge-configs.ts
│   │   ├── plugin-map.ts
│   │   ├── constants/
│   │   │   ├── default-server-options.const.ts
│   │   │   └── default-build-options.const.ts
│   │   ├── interfaces/
│   │   │   ├── plugin-map-entry.interface.ts
│   │   │   ├── workspace-config.interface.ts
│   │   │   └── config-merge-strategy.interface.ts
│   │   ├── utils/
│   │   │   ├── flatten-plugins.util.ts
│   │   │   ├── deep-merge-config.util.ts
│   │   │   └── resolve-plugin-factory.util.ts
│   │   └── index.ts
│   ├── env/                              # "./env": build-time env reader
│   │   ├── workspace-env.ts
│   │   ├── zod-parse.util.ts
│   │   └── index.ts
│   └── testing/                          # "./testing"
│       ├── stub-vite-config.ts
│       └── index.ts
└── __tests__/
    └── unit/
        ├── define-config.test.ts
        ├── merge-configs.test.ts
        ├── plugin-map.test.ts
        └── workspace-env.test.ts
```

## Plugin-factory contract

Every plugin entry MUST expose:

```typescript
interface IPluginMapEntry<T = unknown> {
  enabled: boolean;
  factory: (options: T) => Plugin | Plugin[] | Promise<Plugin | Plugin[]>;
  options: T;
}
```

The orchestrator:

1. Filters `enabled: true` entries.
2. Calls `factory(options)`.
3. Flattens arrays (some plugins return multi-plugin arrays).
4. Awaits promises (async factories supported).

## Workspace defaults

Every `defineConfig` call inherits these defaults (overridable):

- `resolve.alias`: workspace-standard `@/` → `src/`.
- `server.port`: `3000`.
- `server.host`: `true` (bind 0.0.0.0 for Docker).
- `build.target`: `es2022`.
- `build.sourcemap`: `true` in dev, `hidden` in prod.
- `envPrefix`: `["VITE_", "APP_"]` — allows `APP_*` env vars in addition to
  Vite's default `VITE_*`.

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton.
- [ ] `defineConfig` w/ workspace defaults.

### Phase 2 — Plugin-map envelope (2 days)

- [ ] `pluginMap<T>()` typed helper.
- [ ] Async factory support (returns Promise).
- [ ] Array-return support (a factory returns multiple plugins).

### Phase 3 — Config merge (2 days)

- [ ] Deep merge preserving plugin-map semantics.
- [ ] `alias` merge — right-most wins per-alias-key.
- [ ] Array fields (`optimizeDeps.exclude`) — concat + dedupe.

### Phase 4 — Env reader (2 days)

- [ ] `WorkspaceEnv.parse()` w/ Zod schema.
- [ ] Fails Vite build on missing required key.
- [ ] Types the returned object w/ `z.infer`.

### Phase 5 — Testing + docs (1 day)

- [ ] Unit tests (12+).
- [ ] README documents every helper w/ a 5-plugin composite example.
- [ ] Cross-refs to `@stackra/config`, `@stackra/i18n`, `@stackra/testing` (each
      of which ships a Vite plugin).

## Exit criteria

- [ ] 3 subpath exports build cleanly.
- [ ] `defineConfig` accepts every legal Vite `UserConfig` field.
- [ ] `mergeConfigs` deep-merges 3+ configs deterministically.
- [ ] Env reader fails build on missing required key.
- [ ] `apps/portal` + `apps/landing-page` migrated to use it (post-testing
      migration).
- [ ] 90% branch coverage.

## Cross-refs

- `.ref/packages/vite/` — reference implementation.
- `@stackra/testing` — Vitest preset (composes similar shape).
- `@stackra/config` — the `virtual:stackra-config` Vite plugin.
