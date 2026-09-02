---
inclusion: fileMatch
fileMatchPattern: "frontend/packages/**/{package.json,README.md,src/**/*.ts,src/**/*.tsx}"
---

# Frontend package architecture

> **ADR anchor.** This steering codifies
> [ADR-0023](../../docs/adr/0023-frontend-package-architecture.md) — Frontend
> package architecture: DI-first, no refine.dev at the framework layer. Every
> rule below is enforceable; changing a rule means amending the ADR.
>
> **Refine boundary (amends ADR-0023).** Codified by
> [ADR-0060](../../docs/adr/0060-refine-dev-framework-app-boundary.md) —
> `@refinedev/*` is BANNED at the framework layer (every `@stackra/*` package
> under `frontend/packages/*`) and ALLOWED at the app layer (`apps/*/src/`) as
> an implementation detail composed on top of `@stackra/query` as the underlying
> `dataProvider`. Framework packages MUST NOT list `@refinedev/*` as a peer or
> dev dependency. App CRUD ergonomics prescribed by
> `frontend-module-architecture.md` compose Refine on top of the framework's
> DI-first primitives.

## Scope

Every `@stackra/*` package at `frontend/packages/<name>/` is a TypeScript
package that ships React + optionally React Native subpaths. Some are mirrors of
a backend package that owns the wire contract (`rbac` ↔ `stackra/rbac`); others
are frontend-only framework primitives (`@stackra/container`, `@stackra/queue`,
`@stackra/cache`, `@stackra/logger`, ...) with no backend pair. Both shapes
converge on the same folder + tooling + peer-dep rules.

Never colocate a `/react` folder inside a backend package.

## Related steering (2026-07-25 update)

The rules below are the earliest doctrine for frontend packages. As the
workspace matured, several concerns got their own dedicated steering docs that
this file cross-references now:

- `subpath-layering.md` — subpath dependency direction (`core` → `react` /
  `native` / `testing` / `vite` / `console`; never the reverse).
- `code-standards.md` — folder taxonomy, one-export-per-file, per-folder
  barrels.
- `package-conventions.md` — module + config trio + `tsup` / `vitest` /
  `tsconfig` canonical shape + dependency classification.
- `catalog-manifest.md` — per-package `catalog.json` contract.
- `frontend-localization.md` — per-package i18n catalogs.
- `contract-reexports.md` — cross-package re-export rules.
- `contracts-and-decorators-promotion.md` — when a symbol moves to
  `@stackra/contracts` / `@stackra/decorators`.
- `browser-safe-imports.md` — Node-safe browser bundles.
- `ui-components.md` — HeroUI-based React subpath rules.
- `frontend-package-audit-checklist.md` — the master audit checklist every
  reviewer walks per package.

When those newer docs and this file disagree, the **newer doc wins**.

Reference implementations: `@stackra/network` (framework-plumbing package with
`core` + `react` + `native` + `testing` subpaths) and `@stackra/rbac` (feature
package with `core` + `react` + `testing` subpaths).

## 1. Naming and location

| Backend                            | Frontend                                    |
| ---------------------------------- | ------------------------------------------- |
| Service: `stackra/<name>`          | npm: `@stackra/<name>`                      |
| Path: `backend/<name>/`            | Path: `frontend/packages/<name>/`           |
| Wire owner: the service's HTTP API | TS exports: `@stackra/<name>` barrel        |
| Contract: `api/openapi.yaml`       | Consumer of that contract: this package     |

Directory name matches on both sides (kebab-case). Register the package in the
workspace root's `package.json workspaces` under the
`packages: - "frontend/packages/*"` glob — no config change needed for a new
package as long as it lives at the top level of `frontend/packages/`.

## 2. Canonical file structure

Every frontend package at `frontend/packages/<name>/` converges on the same
manifest set + `src/` layout. The `src/` layout is **subpath-based** (`core/`

- optional `react/` + optional `native/` + optional `testing/`), per
  `subpath-layering.md`.

```
frontend/packages/<name>/
├── package.json                  ← "@stackra/<name>"; canonical shape in package-conventions.md
├── tsconfig.json                 ← extends "@stackra/typescript-config/base"
├── tsup.config.ts                ← uses defineBaseConfig from "@stackra/tsup-config"
├── vitest.config.ts              ← merges "@stackra/testing/preset"
├── catalog.json                  ← per-package metadata; see catalog-manifest.md
├── README.md
├── CHANGELOG.md                  ← auto-managed by changesets
├── LICENSE
├── config/                       ← publishable config templates (optional)
├── __tests__/                    ← Vitest tests
└── src/
    ├── core/                     ← platform-agnostic root (required)
    │   ├── index.ts              ← @stackra/<name> public API barrel
    │   ├── <name>.module.ts      ← DI module; see package-conventions.md
    │   ├── constants/
    │   ├── enums/
    │   ├── i18n/                 ← en.json + ar.json when user-facing
    │   ├── interfaces/
    │   ├── services/
    │   ├── tokens/
    │   ├── types/
    │   └── utils/
    ├── react/                    ← web subpath (optional)
    │   ├── index.ts              ← @stackra/<name>/react public API barrel
    │   ├── web-<name>.module.ts  ← platform module; only when it adds a DI binding
    │   ├── components/
    │   ├── contexts/
    │   ├── hooks/
    │   ├── pages/
    │   ├── providers/
    │   └── routes/               ← RoutingModule.forFeature() contributions
    ├── native/                   ← React Native subpath (optional)
    │   ├── index.ts              ← @stackra/<name>/native public API barrel
    │   ├── native-<name>.module.ts
    │   ├── components/
    │   ├── hooks/
    │   └── providers/
    └── testing/                  ← test doubles subpath (optional)
        ├── index.ts              ← @stackra/<name>/testing public API barrel
        ├── mocks/
        └── test-<name>-provider/
```

Rules:

- Only create the subpaths a package actually ships. A framework-plumbing
  package with no UI might have `core/` + `testing/` only; a full feature
  package with `core/` + `react/` + `native/` + `testing/`.
- Every subpath has its own `index.ts` public-API barrel.
- Every subpath in `src/` has a matching entry in `package.json.exports` and
  `tsup.config.ts`.
- Every subpath in `src/` shows up in `catalog.json.surfaces` (per
  `catalog-manifest.md`).

The full subpath dependency rules live in `subpath-layering.md`. In short:
`core/` never imports from sibling subpaths; `react/` and `native/` import from
`core/` only.

## 3. Wire contract — types and enums

TypeScript types are direct mirrors of the backend service's response schemas
declared in its `api/openapi.yaml`. Field names are camelCase on the TS side
(matches the wire's snake_case → camelCase mapping).

Hand-author on the first frontend package for a domain. Migrate to OpenAPI
generation (the service emits `api/openapi.yaml`; a codegen step emits the TS
types) once the frontend consumes 3+ backend services — the cost of hand-syncing
crosses the break-even at that point.

Enums use TypeScript const objects + literal-union types (never `enum {}` — poor
tree-shaking, poor union inference):

```typescript
export const FlagKind = {
  KillSwitch: "kill_switch",
  Override: "override",
  Rollout: "rollout",
  PlanGate: "plan_gate",
} as const;
export type FlagKind = (typeof FlagKind)[keyof typeof FlagKind];
```

Backing values match the backend enum exactly. A change in one side breaks the
parity test in the frontend `__tests__/enums/` folder.

## 4. API client — HTTP surface

One file per bounded context under `src/api/`. Each file:

- imports a shared `client.ts` (ky or Axios wrapper — check
  `packages/foundation/container/` for the existing HTTP client before adding a
  new dependency)
- exports one function per backend endpoint
- typed by the DTOs in `src/types/`

Example:

```typescript
// src/api/overrides.ts
import type { FeatureOverrideData } from "../types";
import { client } from "./client";

export const listOverrides = () =>
  client.get<FeatureOverrideData[]>("/api/v1/feature-flags/overrides");
```

Naming mirrors the backend endpoints
(`POST /api/v1/feature-flags/overrides` ↔ `api/overrides.ts:createOverride()`).

## 5. React Query hooks

`@tanstack/react-query` for every server-state call. Queries use `use<Noun>`,
mutations use `useCreate<Noun>` / `useUpdate<Noun>` / `useDelete<Noun>`. Every
mutation invalidates the matching query key on success.

Query keys follow the pattern `[<package-name>, <resource>, ...args]`:

```typescript
export const featureFlagsKeys = {
  all: ["feature-flags"] as const,
  overrides: () => [...featureFlagsKeys.all, "overrides"] as const,
  override: (id: string) => [...featureFlagsKeys.overrides(), id] as const,
} as const;
```

## 6. Hot-path consumer hook + context provider

Every consumer package that ships a "check this thing" hook follows the same
shape:

- A `<Provider>` component reads the boot payload once from `GET /api/v1/me` and
  populates a React context.
- A `useFeature(name)` (or equivalent) hook reads from that context — **no HTTP
  per check**. That's the whole point of the boot payload contract on the
  backend.
- A fallback `useFeatureResolution(name)` hook makes a live
  `GET /api/v1/me/features` call for diagnostic paths.

Never make the fast path do HTTP. The backend `BootPayloadContributor` exists
precisely to eliminate per-check requests.

## 7. Compound components — HeroUI-native

Consumer-facing components use the HeroUI compound-component pattern when the
component has multiple children slots:

```tsx
<FeatureGate flag="billing.new_flow">
  <FeatureGate.Show>
    <NewBillingCheckout />
  </FeatureGate.Show>
  <FeatureGate.Fallback>
    <LegacyCheckout />
  </FeatureGate.Fallback>
</FeatureGate>
```

Single-file when the component has one visual output (`<FlagBadge>`,
`<RolloutSlider>`, `<KillSwitchToggle>`).

Never ship your own design system — compose HeroUI primitives (`Button`, `Chip`,
`Card`, `Table`, `Slider`, `Switch`) from `@heroui/react`.

## 8. Algorithm parity

When the backend ships a pure algorithm (`rolloutHasher.bucket`,
`scopePath.deepestLevel`, `FeatureResolution` value semantics), the frontend
ships a byte-for-byte-identical implementation.

Every parity implementation has a property test in `__tests__/utils/` that:

- snapshots a set of `(input, output)` pairs generated by the backend
- runs the frontend implementation on the same inputs
- asserts strict equality

If backend and frontend ever diverge on a pure algorithm, the resolver decision
diverges and every downstream cache is poisoned. Property tests are the only
defence.

## 9. Testing surface

Every consumer-facing package ships a `testing/` module:

- `Test<Name>Provider` — replaces the real provider with an in-memory
  implementation for consumer tests
- `mockApi.ts` — MSW handlers or a plain object mock

Downstream apps import from `@stackra/<name>/testing`:

```typescript
// consumer app test
import { TestFeatureFlagsProvider } from '@stackra/feature-flags/testing';

render(
  <TestFeatureFlagsProvider flags={{ 'billing.new_flow': true }}>
    <CheckoutPage />
  </TestFeatureFlagsProvider>
);
```

The testing entry point is exported from `package.json` under `./testing` so it
tree-shakes out of production bundles.

## 10. Order of operations

1. **Backend package is diagnostics-clean and the SDK sibling ships stable Data
   classes.** No frontend work before this.
2. **Author the frontend package's types + enums first.** Import nothing from
   the backend repo. TS mirrors are the wire contract.
3. **Ship the API client second.** Just typed HTTP wrappers.
4. **Provider + hot-path hook third.** Context reads boot payload.
5. **Compound components fourth.** Consumer-facing UI on top of HeroUI
   primitives.
6. **Admin surface last** (list / create / update / delete tables
   - forms). Admin consumes React Query hooks defined earlier.
7. **Testing utilities as you go.** Every new hook / component ships with a
   corresponding testing helper.

## 11. Anti-patterns

| Anti-pattern                                             | Correct                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/react` folder inside a backend package                 | Frontend package at `frontend/packages/<name>/`                        |
| TypeScript `enum {}`                                     | `const {} as const` + literal-union type                               |
| `fetch()` per `useFeature()` call                        | Read from context populated by boot payload                            |
| Custom design system components                          | Compose `@heroui/react` primitives                                     |
| Duplicating validation rules from the backend schema     | Trust the server; surface server errors in the UI                      |
| Hand-syncing types across 3+ packages                    | OpenAPI generation from the service's `api/openapi.yaml`               |
| Query key strings                                        | Typed query-key factories (`featureFlagsKeys.override(id)`)            |
| Mutation without invalidation                            | Every mutation invalidates its matching query key                      |
| Ad-hoc mocks in downstream tests                         | Import `Test<Name>Provider` + `mockApi` from `@stackra/<name>/testing` |
| Frontend algorithm without a parity test                 | Property test that snapshots backend outputs                           |

## 12. Package.json conventions

Match `packages/foundation/container/package.json` shape:

- `"main"` + `"types"` point to `./src/<barrel>/index.ts` (JIT mode — no `build`
  step; Vite / tsup compiles on demand from the consumer app)
- `"exports"` map every published entry (default barrel, `./testing`, `./utils`
  where relevant)
- `"sideEffects": false` for tree-shakeability
- Peer-dependencies for React, `@heroui/react`, `@tanstack/react-query` — never
  bundle them
- `"scripts"`: `build` (no-op / JIT), `typecheck` (`tsc --noEmit`), `test`
  (`vitest run`), `test:watch`, `test:coverage`

## 13. README shape

Every frontend package ships a README with:

- One-paragraph purpose statement
- Installation (in the monorepo it's already wired via `workspace:*`)
- Basic usage — one runnable example
- Hooks / components reference (auto-generatable from JSDoc)
- Testing section (how to mount `TestProvider` in downstream tests)
- Cross-reference to the backend package README

Keep prose tight — the same docblock discipline as the backend (minimal per-file
docblocks + focused prose in class docblocks).

## 14. File naming and layout conventions

Verified against `frontend/packages/ui/src/react/**`. Every new frontend package
must match this convention exactly. Reference files:

- Component:
  `frontend/packages/ui/src/react/components/pin-lock/pin-lock.component.tsx`
- Hook: `frontend/packages/ui/src/core/hooks/use-debounce/use-debounce.hook.ts`
- Provider:
  `frontend/packages/ui/src/react/providers/page-progress/page-progress.provider.tsx`
- Context:
  `frontend/packages/ui/src/react/contexts/page-progress/page-progress.context.ts`
- Interface:
  `frontend/packages/ui/src/react/components/pin-lock/pin-lock.interface.ts`

### 14.1 File-name shape — kebab-case with role suffix

Every source file's name is `<kebab-noun>.<role>.<ext>`:

| Role                       | Suffix       | Extension    |
| -------------------------- | ------------ | ------------ |
| React component            | `.component` | `.tsx`       |
| React hook                 | `.hook`      | `.ts`        |
| Context provider           | `.provider`  | `.tsx`       |
| React context              | `.context`   | `.ts`        |
| TypeScript interface       | `.interface` | `.ts`        |
| TypeScript type alias file | `.type`      | `.ts`        |
| Enum / literal-union table | `.enum`      | `.ts`        |
| Pure utility function      | `.util`      | `.ts`        |
| API client per domain      | `.api`       | `.ts`        |
| Test file                  | `.test`      | `.ts`/`.tsx` |

No `PascalCase.ts` files. No `camelCase.ts` files. All lowercase, words
separated by `-`.

### 14.2 Folder-per-thing — every named export lives in its own folder

Every component, hook, provider, context, and utility gets its own folder named
after the export. The folder contains the file(s) for that export plus an
`index.ts` barrel:

```
components/feature-gate/
├── feature-gate.component.tsx
├── feature-gate.interface.ts
└── index.ts                       ← barrel — exports the component + its props type

hooks/use-feature/
├── use-feature.hook.ts
├── use-feature.interface.ts       ← only when the hook has non-trivial types
└── index.ts

providers/feature-flags/
├── feature-flags.provider.tsx
├── feature-flags.interface.ts
└── index.ts

contexts/feature-flags/
├── feature-flags.context.ts
└── index.ts

utilities/rollout-hasher/
├── rollout-hasher.util.ts
└── index.ts
```

Single-file exports still get their own folder — the `index.ts` barrel is the
public boundary. That keeps consumer imports insulated from filename changes
(`import { useFeature } from '@stackra/feature-flags'`).

### 14.3 Folder names (plural at the collection level)

- `components/` — never `component/`
- `hooks/` — never `hook/`
- `providers/` — never `provider/`
- `contexts/` — never `context/`
- `utilities/` — never `utils/` or `util/`
- `types/` — never `type/`
- `enums/` — never `enum/`
- `api/` — never `apis/` (semantically singular — one API domain per file)
- `testing/` — the testing utilities barrel

Enums are the one exception to §14.2 — they stay **flat** under
`src/enums/<name>.enum.ts` because enums rarely grow interface siblings. Same
for types when the file is a pure interface/type declaration without a matching
runtime export (`src/types/<name>.interface.ts`).

### 14.4 Interface-name prefix rule

Data-shape interfaces get an `I` prefix (`IFeatureFlagData`,
`IPageProgressContextValue`). React component prop interfaces use a `Props`
suffix without the prefix (`FeatureGateProps`, `PinLockProps`).

### 14.5 Barrel discipline

- Every folder has an `index.ts` that re-exports every public symbol from the
  files in that folder.
- The `src/index.ts` root barrel re-exports every public folder.
- Never import from a file path — always import from the folder (which routes
  through the barrel):

  ```typescript
  // ❌ deep import
  import { FeatureGate } from "@/components/feature-gate/feature-gate.component";

  // ✅ folder import (routes through index.ts)
  import { FeatureGate } from "@/components/feature-gate";

  // ✅ package import (top-level barrel)
  import { FeatureGate } from "@stackra/feature-flags";
  ```

### 14.6 Anti-patterns

| Anti-pattern                                                           | Correct                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `FeatureGate.tsx` at the top level of `components/`                    | `components/feature-gate/feature-gate.component.tsx` + `index.ts`     |
| `useFeature.ts` at the top level of `hooks/`                           | `hooks/use-feature/use-feature.hook.ts` + `index.ts`                  |
| `FeatureFlagsProvider.tsx` under `providers/`                          | `providers/feature-flags/feature-flags.provider.tsx` + `index.ts`     |
| `types.ts` catch-all                                                   | One file per interface — `types/feature-flag-data.interface.ts`       |
| `context/` (singular)                                                  | `contexts/` (plural)                                                  |
| `utils/`                                                               | `utilities/`                                                          |
| `FeatureGateProps` in a file called `FeatureGate.tsx`                  | Split into `feature-gate.component.tsx` + `feature-gate.interface.ts` |
| Importing from `../../../utilities/rollout-hasher/rollout-hasher.util` | Import from `@/utilities/rollout-hasher` (folder)                     |
| Two components in one folder                                           | One folder per component                                              |

## 15. Data-package target state (extracted)

Sections 15-24 of a previous revision described a forward-looking
`@stackra/data` + `IResourceProvider<T>` architecture — 15 generic
resource-shape hooks + a `ResourceToken<T>` promotion pattern — that is NOT yet
shipping.

Those sections have been extracted to
[`.kiro/plans/frontend-data-package.md`](../plans/frontend-data-package.md) so
this steering only carries currently-enforced rules. Consult the plans doc for
the design intent; do **not** audit shipping code against §15-24.

**Current data-shape guidance**: use `@stackra/query` (React Query wrapper) and
`@stackra/state` (TanStack Store bindings) directly, per the shipping packages'
READMEs. Per-domain hooks (`useX` / `useCreateX` / `useUpdateX`) are the current
convention.
