# Contracts + decorators promotion

Rules for when a symbol currently living inside a feature package should be
promoted to `@stackra/contracts`, and when a decorator currently living inside a
feature package should be promoted to `@stackra/decorators`.

Both packages are "framework vocabularies" — every workspace package can consume
them without pulling in unrelated runtime code. Symbols that belong there are
declared here; symbols that don't stay where they were.

Read alongside:

- `contract-reexports.md` — feature packages don't re-export contracts symbols;
  promotion is the only path.
- `code-standards.md` — where DI tokens, interfaces, and decorator files live
  inside a package.
- `subpath-layering.md` — feature packages import from `@stackra/contracts`,
  never the reverse.
- `package-conventions.md` — module + config trio, decorator registration.

## Rule — the promotion threshold

A symbol (interface, DI token, enum, decorator, contract-level type) moves from
a feature package to `@stackra/contracts` or `@stackra/decorators` when EITHER
test below is true.

### Test A — Multi-consumer

The symbol is imported by TWO OR MORE separately-owned packages.

"Separately-owned" means:

- Two different feature packages (`rbac` + `delegation` both import).
- A feature package + the framework core (`http` + `container` both import).
- Two different runtime tiers (web + native + Node all consume).

"NOT separately-owned":

- A package importing its own subpath (`rbac/react` importing `rbac/core`).
  That's internal composition, not cross-package.
- Test doubles in `<pkg>/testing/` importing the package's own core.

### Test B — Seam

The symbol IS the seam between an implementer and its consumers.

Every DI token that belongs to a cross-package protocol (`NETWORK_DETECTOR`,
`HTTP_SERVICE`, `STORAGE_MANAGER`, `AI_TRANSPORT`, `LOGGER_MANAGER`) lives in
`@stackra/contracts` from day one, not after a second consumer appears. The
token IS the seam.

Interfaces that describe a cross-package protocol are the same story:
`INetworkDetector`, `IStorage`, `IAiClient` live in contracts because they're
the shape both sides agree on.

## What lives where

### `@stackra/contracts` owns

- **DI tokens** for cross-package services. `NETWORK_DETECTOR`, `HTTP_SERVICE`,
  `STORAGE_MANAGER`, `AI_TRANSPORT`, `LOGGER_MANAGER`, `EVENT_EMITTER`,
  `DISCOVERY_SERVICE`.
- **Interfaces** for cross-package services. `INetworkDetector`, `IStorage`,
  `IAiClient`, `ILoggerManager`, `IDiscoveryService`.
- **Cross-package event maps** — the framework-level lifecycle events every
  module observes (`application.bootstrapped`, `module.registered`).
- **Cross-package enums** consumed by more than one package (`Sensitivity`,
  `LogLevel`, `HttpMethod`).
- **Framework primitives** — `Type<T>`, `Provider`, `DynamicModule`, `Scope`,
  lifecycle-hook interfaces (`OnModuleInit`, `OnApplicationBootstrap`).

### `@stackra/decorators` owns

- Class + method decorators consumed by TWO OR MORE separately-owned packages.
- Decorators discovered by a framework-side bootstrapper that scans across
  packages — routing's `@AsController`, cache's `@Cacheable`, queue's
  `@Processor`, events' `@OnEvent`.
- Sub-domain organisation: `decorators/<consumer-name>/` mirrors each consuming
  package's slug — `decorators/cache/`, `decorators/queue/`,
  `decorators/routing/`, `decorators/events/`, `decorators/logger/`.

### What stays in the feature package

- **Concrete classes** — `BrowserNetworkDetector`, `SseTransport`,
  `MemoryDriver`, `LocalStorageStore`. These are implementations of a contract;
  the contract goes to `@stackra/contracts`, the class stays in its feature
  package.
- **Internal helpers** that only the feature itself consumes.
- **Package-private tokens** — a DI token that only wires internal services
  inside one package. Rare — most tokens are cross-package seams the moment a
  second consumer appears.
- **Package-owned enums** with no cross-package consumer.
- **Decorators with exactly one consumer.** A decorator used only by its owning
  package stays in the package until a second consumer emerges.

### DI framework primitives — the container decorator quintet

> **ADR anchor.** Codified by
> [ADR-0059](../../docs/adr/0059-container-decorator-quintet-exception.md) —
> Container decorator quintet stays a framework-primitive exception.

Five DI decorators live PERMANENTLY in `@stackra/container`'s public API and are
NEVER promoted, regardless of consumer count:

- `Module`
- `Injectable`
- `Inject`
- `Optional`
- `Global`

**Rationale.** These are the DI framework's OWN vocabulary —
`@stackra/container` is the NestJS-compatible DI runtime the workspace ships,
and `@nestjs/common` re-exports the same five decorators from the DI framework
itself. Splitting them into `@stackra/decorators/container/` would ship the same
decorators at a new path with no behavioural difference, force 180+ files to
churn, and break the "familiar to NestJS contributors" contract stated in
`@stackra/container/README.md`.

**Scope of the exception.** Applies ONLY to these five decorators inside
`@stackra/container`'s `.` entry (the core subpath). The
`@stackra/container/react` subpath's React-specific hooks / providers /
decorators are outside this exception. Future consumer-level decorators
(`@Cacheable`, `@Processor`, `@OnEvent`, `@AsController`, `@Widget`, ...)
continue to follow the normal Test A + Test B thresholds and land in
`@stackra/decorators/<consumer>/` when promoted.

## Rule — promotion is a two-commit dance

Because promotion changes the public API of two packages, the migration is
deliberate:

1. **Preparation commit** — add the symbol to `@stackra/contracts` (or
   `@stackra/decorators`). Do NOT remove it from the feature package yet. The
   new location is available; the old location still works. Mark the old
   location as `@deprecated` in JSDoc so IDEs flag it.
2. **Migration commits** — update every consumer to import from the new
   location. One consumer per commit for reviewability.
3. **Removal commit** — delete the symbol from the feature package. Consumers
   that missed the migration break at TypeScript compile time — that's the
   point.

Semver: the preparation commit is a MINOR bump on `@stackra/contracts` + the
feature package. The removal commit is a MAJOR bump on the feature package
(breaking public-API change).

## Rule — sub-domain layout inside `@stackra/decorators`

`@stackra/decorators` is organised by consumer, not by concept:

```
frontend/packages/decorators/src/
  cache/              ← decorators consumed by @stackra/cache
  events/             ← decorators consumed by @stackra/events
  logger/             ← decorators consumed by @stackra/logger
  queue/              ← decorators consumed by @stackra/queue
  routing/            ← decorators consumed by @stackra/routing
```

Each sub-domain ships its own `package.json` `exports` entry so a consumer
imports precisely what it needs:

```ts
import { AsController } from "@stackra/decorators/routing";
import { Processor } from "@stackra/decorators/queue";
import { Cacheable } from "@stackra/decorators/cache";
```

Adding a new sub-domain = adding a new consumer package. The name of the new
sub-domain matches the consumer's slug exactly (no `decorators/common/`, no
`decorators/misc/`).

## Rule — the promotion decision is made by the CONSUMING side

When a second consumer wants to import a symbol that lives in a feature package,
the DECISION to promote belongs to the CONSUMER, not the owning package. Two
options for the consumer:

- **Copy-paste the symbol** into your own package (fastest for one-off needs,
  adds drift risk).
- **Promote the symbol** to `@stackra/contracts` / `@stackra/decorators` (adds a
  two-commit dance, eliminates drift).

The threshold at which promotion beats copy-paste is subjective but codified:
once the symbol has THREE consumers or is a DI token, promote. Below that,
copy-paste is defensible.

## Anti-patterns

| Anti-pattern                                                         | Fix                                                                                                       |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| DI token in a feature package, imported by two other packages        | Promote to `@stackra/contracts` in the preparation commit; migrate consumers; drop.                       |
| `INetworkStatus` re-exported from `@stackra/network` for convenience | Consumers import from `@stackra/contracts` directly (per `contract-reexports.md`).                        |
| Decorator in feature-package `src/decorators/` used by two consumers | Promote to `@stackra/decorators/<consumer>/` in the preparation commit.                                   |
| Concrete class in `@stackra/contracts`                               | Move back to a feature package. Contracts owns shapes and tokens, not code.                               |
| `@stackra/decorators` grows a `common/` or `shared/` sub-domain      | Each decorator picks ONE consumer to belong to; if genuinely shared by all, `@stackra/contracts` owns it. |
| Direct import from a decorator's implementation file                 | Import from the sub-domain barrel: `@stackra/decorators/routing`.                                         |
| Promotion + removal in a single commit                               | Two commits — one adds the new home, one removes the old. Consumers migrate between.                      |
| A `.type.ts` alias promoted to contracts without its DI token        | Promote both together — the type is only useful with the token that carries it.                           |
| Copy-paste the same interface into three feature packages            | Promote after the third consumer. Below that threshold, copy-paste is defensible.                         |

## Enforcement

Zero-hit greps:

- **Concrete class in `@stackra/contracts`**: `export class` (not
  `export interface`, not `export type`, not `export const` for tokens) inside
  `frontend/packages/contracts/src/`. Zero hits.
- **Non-package-slug sub-domain inside `@stackra/decorators`** — a folder under
  `decorators/src/` that isn't a `@stackra/*` consumer slug. Zero hits (allowed:
  the shared `core/` folder that only holds barrels + shared metadata
  utilities).
- **Feature package re-exporting from `@stackra/contracts`** — enforced by
  `contract-reexports.md`.
- **Direct import from a `decorators/*/some-decorator.decorator.ts` path**
  instead of the sub-domain barrel — flagged.

Full audit runs via `frontend-package-auditor` (see
`frontend-package-audit-checklist.md`).

## Cross-references

- `contract-reexports.md` — the "feature packages don't re-export from
  contracts" rule that makes promotion the only path.
- `code-standards.md` — where DI tokens, interfaces, and decorator files live
  inside a package.
- `subpath-layering.md` — cross-subpath imports (feature packages import from
  `@stackra/contracts`, never the other way around).
- `package-conventions.md` — module + config trio, `forFeature` registration.
- `discovery-vs-loader.md` — how decorators discovered by a framework-side
  bootstrapper get wired.
