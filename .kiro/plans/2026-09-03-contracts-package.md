---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://contracts-architecture-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/contracts` — cross-package interfaces + tokens

**Status:** Planned
**Anchor ADRs:** [ADR-0090](../../.docs/adr/ADR-0090-manager-driver-pattern.md),
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md)
**Reference:** `packages/contracts/` (current in-workspace v0.0.1)
**Depends on:** ZERO runtime dependencies (this is the light tier per
`.kiro/steering/contract-implementer-split.md`)
**Design effort:** 15 days across 6 phases

## Purpose

The single source of truth for every cross-package interface, DI token, enum,
and framework-level event map used across every `@stackra/*` package. Ships
NOTHING that carries a runtime dependency — no concrete classes, no vendor
adapters, no HTTP clients. Consumers depend on this without inheriting weight.

Codifies the "light tier" of the contract-implementer split per
`.kiro/steering/contract-implementer-split.md`. Every consumer package (heavy
tier) implements against the interfaces + tokens defined here; testing shims
mock the same interfaces.

## Non-goals

- Concrete classes — `LoggerService`, `HttpClient`, `CacheManager` live in
  their owning packages.
- Vendor coupling — no imports of `axios`, `pino`, `ioredis`, `bcrypt`,
  `@nestjs/*`, `react`, `react-native`.
- Business-domain types — `User`, `Tenant`, `Permission` — those live in the
  workspace's business-domain packages (out of framework scope).
- Test doubles — those ship in `@stackra/testing` (which depends on this).

## Rules `@stackra/contracts` MUST follow

Codified below + enforced by review + a workspace-standardization-steward
audit pass:

1. **Zero runtime deps.** `package.json.dependencies === {}`. Every dep is a
   `devDependencies` for type-only usage. If a type needs `axios.Request`, use
   `import type { AxiosRequestConfig } from "axios"` under `devDependencies`.
2. **Zero concrete classes.** Only `interface`, `type`, `enum`, `const`
   (tokens), and TypeScript utility types. If you find yourself writing
   `class` — the symbol belongs in the owning package.
3. **Zero side effects.** `package.json.sideEffects === false`. Enables full
   tree-shaking.
4. **Every subpath is INTERFACES-only.** Grouped by concern (`auth`, `cache`,
   `db`, ...). Consumers import narrow subpaths so unrelated symbols never
   land in their type-graph.
5. **DI tokens are `unique symbol` values.** Never string literals — string
   collision at runtime is silent; symbol collision is a TS error.

## Subpath layout — per-concern splits

Grouped so consumers import only what they need + circular-dep risk stays
zero. Each subpath is a leaf directory with an `index.ts` barrel.

```
packages/contracts/
├── package.json                          # ~25 subpath exports
├── catalog.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts                          # ".": barrel — re-exports every subpath
│   │
│   ├── auth/                             # "./auth"
│   │   ├── auth-context.interface.ts     # IAuthContext { userId, tenantId, ... }
│   │   ├── principal.interface.ts        # IPrincipal, IPrincipalId
│   │   ├── credentials.interface.ts      # ICredentials
│   │   ├── token.interface.ts            # ITokenClaims, ITokenPayload
│   │   ├── auth.tokens.ts                # AUTH_CONTEXT, PRINCIPAL, ...
│   │   └── index.ts
│   │
│   ├── cache/                            # "./cache"
│   │   ├── cache-store.interface.ts
│   │   ├── cache-manager.interface.ts
│   │   ├── cache-options.interface.ts
│   │   ├── cache.tokens.ts
│   │   └── index.ts
│   │
│   ├── config/                           # "./config"
│   │   ├── config-driver.interface.ts
│   │   ├── config-manager.interface.ts
│   │   ├── config-value-metadata.interface.ts
│   │   ├── config-violation.interface.ts
│   │   ├── config.tokens.ts
│   │   └── index.ts
│   │
│   ├── container/                        # "./container"
│   │   ├── container-resolver.interface.ts
│   │   ├── discovery-service.interface.ts
│   │   ├── module-options.interface.ts
│   │   ├── container.tokens.ts
│   │   └── index.ts
│   │
│   ├── db/                               # "./db"
│   │   ├── database-connection.interface.ts
│   │   ├── entity-manager.interface.ts
│   │   ├── query-builder.interface.ts
│   │   ├── repository.interface.ts
│   │   ├── db.tokens.ts
│   │   └── index.ts
│   │
│   ├── events/                           # "./events"
│   │   ├── event-emitter.interface.ts
│   │   ├── event-handler.interface.ts
│   │   ├── event-envelope.interface.ts
│   │   ├── events.tokens.ts
│   │   └── index.ts
│   │
│   ├── http/                             # "./http"
│   │   ├── http-client.interface.ts
│   │   ├── http-request.interface.ts
│   │   ├── http-response.interface.ts
│   │   ├── http-interceptor.interface.ts
│   │   ├── http.tokens.ts
│   │   └── index.ts
│   │
│   ├── logger/                           # "./logger"
│   │   ├── logger.interface.ts
│   │   ├── logger-channel.interface.ts
│   │   ├── log-level.enum.ts
│   │   ├── logger.tokens.ts
│   │   └── index.ts
│   │
│   ├── observability/                    # "./observability"
│   │   ├── span.interface.ts
│   │   ├── tracer.interface.ts
│   │   ├── metric.interface.ts
│   │   ├── observability.tokens.ts
│   │   └── index.ts
│   │
│   ├── queue/                            # "./queue"
│   │   ├── job.interface.ts
│   │   ├── job-processor.interface.ts
│   │   ├── queue-connector.interface.ts
│   │   ├── queue.tokens.ts
│   │   └── index.ts
│   │
│   ├── storage/                          # "./storage"
│   │   ├── object-store.interface.ts
│   │   ├── file-metadata.interface.ts
│   │   ├── presigned-url.interface.ts
│   │   ├── storage.tokens.ts
│   │   └── index.ts
│   │
│   ├── realtime/                         # "./realtime"
│   │   ├── channel.interface.ts
│   │   ├── room.interface.ts
│   │   ├── presence.interface.ts
│   │   ├── connector.interface.ts
│   │   ├── realtime.tokens.ts
│   │   └── index.ts
│   │
│   ├── redis/                            # "./redis"
│   │   ├── redis-client.interface.ts
│   │   ├── redis-command.type.ts
│   │   ├── redis.tokens.ts
│   │   └── index.ts
│   │
│   ├── coordinator/                      # "./coordinator"
│   │   ├── tab-coordinator.interface.ts
│   │   ├── lock-manager.interface.ts
│   │   ├── tab-transport.interface.ts
│   │   ├── coordinator.tokens.ts
│   │   └── index.ts
│   │
│   ├── settings/                         # "./settings"
│   │   ├── settings-store.interface.ts
│   │   ├── settings-schema.interface.ts
│   │   ├── field-control.enum.ts
│   │   ├── settings.tokens.ts
│   │   └── index.ts
│   │
│   ├── i18n/                             # "./i18n"
│   │   ├── translator.interface.ts
│   │   ├── locale-provider.interface.ts
│   │   ├── i18n.tokens.ts
│   │   └── index.ts
│   │
│   ├── mail/                             # "./mail"
│   │   ├── mailable.interface.ts
│   │   ├── mail-transport.interface.ts
│   │   ├── mail-envelope.interface.ts
│   │   ├── mail.tokens.ts
│   │   └── index.ts
│   │
│   ├── health/                           # "./health"
│   │   ├── health-indicator.interface.ts
│   │   ├── health-check.interface.ts
│   │   ├── health-status.enum.ts
│   │   ├── health.tokens.ts
│   │   └── index.ts
│   │
│   ├── scheduler/                        # "./scheduler"
│   │   ├── scheduled-task.interface.ts
│   │   ├── cron-expression.type.ts
│   │   ├── scheduler.tokens.ts
│   │   └── index.ts
│   │
│   ├── rate-limit/                       # "./rate-limit"
│   │   ├── rate-limit-backend.interface.ts
│   │   ├── rate-limit-policy.interface.ts
│   │   ├── rate-limit.tokens.ts
│   │   └── index.ts
│   │
│   ├── webhook/                          # "./webhook"
│   │   ├── webhook-subscription.interface.ts
│   │   ├── webhook-delivery.interface.ts
│   │   ├── webhook.tokens.ts
│   │   └── index.ts
│   │
│   ├── network/                          # "./network"
│   │   ├── network-detector.interface.ts
│   │   ├── network-status.interface.ts
│   │   ├── network.tokens.ts
│   │   └── index.ts
│   │
│   ├── zones/                            # "./zones"
│   │   ├── zone-contribution.interface.ts
│   │   ├── zone-registry.interface.ts
│   │   ├── zones.tokens.ts
│   │   └── index.ts
│   │
│   └── common/                           # "./common": shared primitives
│       ├── result.type.ts                # Result<T, E>
│       ├── nullable.type.ts
│       ├── deep-partial.type.ts
│       ├── json-value.type.ts
│       ├── async-fn.type.ts
│       └── index.ts
│
└── __tests__/
    └── unit/
        └── exports.test.ts               # Verifies every subpath is importable
```

## Public API — per subpath

Every subpath ships THREE artefact classes:

- **Interfaces** — `I<Name>` contract shape.
- **Enums / types** — value shape for parameterised interfaces.
- **Tokens** — DI symbols the heavy-tier consumers implement against.

Naming rules (locked):

- Interfaces prefixed `I` (`ILogger`, `ICacheManager`) — consistent w/
  `.ref/packages/*` convention.
- Tokens SCREAMING_SNAKE (`LOGGER`, `CACHE_MANAGER`).
- Enums PascalCase w/ SCREAMING_SNAKE members (`LogLevel.INFO`).
- Types PascalCase without prefix (`Result<T, E>`, `AsyncFn<T>`).

## Symbol-based tokens — the collision-safety guarantee

```typescript
// ✅ Locked shape
export const LOGGER: unique symbol = Symbol.for("@stackra/contracts/LOGGER");
export type LOGGER = typeof LOGGER;

// Heavy tier binding
@Injectable()
class LoggerService implements ILogger { ... }
{ provide: LOGGER, useClass: LoggerService }

// Consumer
constructor(@Inject(LOGGER) private readonly logger: ILogger) {}
```

`Symbol.for(name)` guarantees the same symbol across module boundaries even
if a package is loaded twice (bundle+peer duplication). Using
`Symbol("LOGGER")` bare would fail cross-bundle DI resolution.

## Testing

- `__tests__/unit/exports.test.ts` — imports every subpath's barrel and asserts
  every named export exists. Regression-guard against accidentally deleted
  interfaces / tokens.
- No runtime tests needed — this package ships interfaces only. Consumer tests
  drive coverage of the concrete implementations.

## Cross-package promotion rule

**When a symbol is used by 2+ packages OR needs to be substitutable, PROMOTE
it here.** Codified in `.kiro/steering/contracts-and-decorators-promotion.md`:

- Single-consumer symbols stay in their owning package (`@stackra/cache`'s
  private `IMemoryDriver` doesn't need to be here).
- Cross-consumer symbols land here (`ILogger` used by every package → HERE).
- Public API surfaces land here (`IHttpClient` — every service uses HTTP → HERE).

Reviewer flags any `interface I<Name>` in a heavy-tier package used from >1
package that HASN'T been promoted.

## Phases

### Phase 1 — Scaffold + audit existing surface (2 days)

- [ ] Package skeleton per `.kiro/steering/package-conventions.md`.
- [ ] Audit current in-workspace `packages/contracts/src/` — every existing
      interface + token catalogued + assigned a target subpath.
- [ ] Migration table: `<old-path> → <new-path>` for every existing symbol.

### Phase 2 — Foundation subpaths (3 days)

- [ ] `./container`, `./logger`, `./common` — every other subpath depends on
      these.
- [ ] Every existing symbol migrated to its target subpath.
- [ ] Backwards-compat re-export from root barrel for 90 days.

### Phase 3 — Framework subpaths (3 days)

- [ ] `./cache`, `./config`, `./events`, `./http`, `./queue`, `./storage`,
      `./realtime`, `./redis`, `./coordinator`, `./settings`, `./i18n`,
      `./mail`, `./health`, `./scheduler`, `./rate-limit`, `./webhook`,
      `./network`, `./zones`, `./auth`, `./db`, `./observability`.
- [ ] Each subpath consumes ONLY `./container`, `./logger`, `./common` from
      within contracts (no cross-domain coupling).

### Phase 4 — Consumer migration (3 days)

- [ ] Every heavy-tier package (`@stackra/logger`, `@stackra/cache`, ...) MRs
      to import from the new narrow subpath.
- [ ] Root barrel deprecated (still exported for 90 days).
- [ ] Grep-based audit: no consumer imports from `@stackra/contracts` root
      after migration window.

### Phase 5 — Testing + docs (2 days)

- [ ] `exports.test.ts` — every subpath's barrel exhaustive-imported.
- [ ] README documents every subpath + its purpose + which heavy package
      implements it.
- [ ] `.kiro/steering/contracts-and-decorators-promotion.md` cross-refs.

### Phase 6 — Verification (2 days)

- [ ] Bundle-size check: every consumer subpath adds `< 500 bytes` to the
      consumer's built output.
- [ ] Tree-shake check: consuming ONE token pulls only that token's file
      (verified with `esbuild --analyze`).
- [ ] Circular-dep check: `madge --circular` returns empty.
- [ ] `sideEffects: false` verified in built output.

## Exit criteria

- [ ] 25+ subpath exports build cleanly.
- [ ] Zero concrete classes; every top-level export is `interface`, `type`,
      `enum`, or `const` (token).
- [ ] Bundle-size: importing every subpath adds `< 5 KB` gzipped.
- [ ] Tree-shakability: consuming ONE token from `@stackra/contracts/logger`
      pulls only the logger subpath (no cache / http / db symbols).
- [ ] Zero circular deps across subpaths.
- [ ] Zero runtime dependencies in `package.json`.
- [ ] Every heavy-tier package migrated off root-barrel imports.

## Cross-refs

- ADR-0090, 0091, 0092.
- `.kiro/steering/contract-implementer-split.md` — the light-vs-heavy pattern.
- `.kiro/steering/contracts-and-decorators-promotion.md` — when to promote.
- Sibling plans: every framework package plan references its own subpath here.
