# Subpath layering

Rules for how source in a `@stackra/*` package's subpaths depend on each other.
Every multi-entry-point package (`core/`, `react/`, `native/`, `testing/`,
`vite/`, `console/`, ...) follows a strict layering direction. Sibling subpaths
NEVER import each other.

Read alongside:

- `code-standards.md` — where files live inside a subpath.
- `package-conventions.md` — the module + config trio each subpath registers.
- `ui-components.md` — the React subpath's folder layout.
- `contract-reexports.md` — what a subpath's public API may re-export.
- `browser-safe-imports.md` — the runtime-safety rule that pairs with the
  layering rule (a subpath in the browser-loaded surface must not touch
  `node:*`).

## Rule — subpath dependency direction is one-way and top-down

Every subpath under a package's `src/` belongs to one of two roles:

- **Platform-agnostic root** — always `core/` (or a package's flat `src/` for
  single-entry packages). Contains code that runs on every runtime the package
  supports (Node, tests, RN, web). Never imports from a sibling subpath.
- **Platform / consumer subpath** — `react/`, `native/`, `testing/`, `vite/`,
  `console/`, `actions/`, etc. Adds runtime-specific bindings on top of `core/`.
  Imports FROM `core/` freely; NEVER imports from a sibling platform subpath.

The composition graph:

```
     core/           ← platform-agnostic; no sibling imports, ever
      │
      ├── react/     ← imports from core; adds DOM/React DI
      ├── native/    ← imports from core; adds RN DI
      ├── testing/   ← imports from core; adds test doubles
      ├── vite/      ← imports from core; adds build-time DI
      └── console/   ← imports from core; adds CLI DI
```

Forbidden directions:

- `core/**` importing `@/react/`, `@/native/`, `@/testing/`, `@/vite/`,
  `@/console/`, `@/actions/`, or any relative equivalent (`../react/`,
  `../../react/`, ...). **Zero hits allowed.**
- `react/**` importing `@/native/` (or relative equivalent). Zero hits.
- `native/**` importing `@/react/` (or relative equivalent). Zero hits.
- Any platform subpath importing another platform subpath — with the narrow
  exception below.

### Narrow exception — platform-specific test helpers

A file under `testing/` MAY import from `react/` OR `native/` when the helper is
EXPLICITLY a test double / mount helper / mock factory for that specific
platform. Examples:

- `auth-ui/testing/render-auth-form.util.tsx` — mounts the react
  `AuthUiProvider` for consumer tests → `testing → react` is allowed.
- `error/testing/create-mock-error-boundary.tsx` — mocks the react
  `ErrorBoundary` → `testing → react` is allowed.
- `routing/testing/create-test-router.util.ts` — builds a test router using the
  react `attachMiddleware` → `testing → react` is allowed.

The exception does NOT extend to:

- A single testing file importing BOTH `react/` AND `native/` — split into two
  files, one per platform.
- Testing files that import runtime code from `react/` for use in
  general-purpose (platform-agnostic) test fixtures — those helpers belong to
  `core/testing` conceptually; move them to `core/` and re-export via
  `testing/`.

Cross-platform test doubles (mock services, factory builders, seed data) still
go through `core/testing/` OR live at the top of `testing/` without touching a
platform subpath.

Rationale — three concrete failure modes:

1. **Tree-shaking breaks.** A Node/Vitest test that imports only a service from
   `@stackra/x` transitively pulls the react-subpath route builder and its lazy
   component refs, because `core` imports from `react`. The bundler cannot cut
   the react graph out.
2. **A future `native/` subpath is blocked.** `native/native-x.module.ts`
   imports `core/x.module.ts`. If `core` transitively pulls `react/`, the RN
   bundler links DOM code into a mobile app.
3. **The peer-deps promise breaks.** `@stackra/routing`, `@stackra/ui`, `react`
   are marked `optional` in a package's `peerDependenciesMeta`. But if `core`'s
   `forRoot` unconditionally calls a react-subpath util, the Node consumer hits
   a hard runtime dependency the peer-deps table promised was optional.

## Rule — a platform subpath ships a `.module.ts` only when it adds a DI binding

Two shapes are legitimate for a platform subpath. Pick the one that matches what
the platform actually contributes; never invent a third.

### Shape 1 — the platform module (`react/web-<name>.module.ts`)

Use when the platform adds ANY new DI binding:

- A browser detector, a DOM adapter, an SSE transport, a storage driver.
- A `forFeature(...)` contribution that consumes React-runtime tokens — routes
  with lazy React components, theme bindings.

```ts
@Module({})
export class WebNetworkModule {
  public static forRoot(options?: NetworkModuleOptions): DynamicModule {
    return {
      module: WebNetworkModule,
      global: true,
      imports: [NetworkModule.forRoot(options)], // ← compose core
      providers: [
        BrowserNetworkDetector,
        { provide: NETWORK_DETECTOR, useClass: BrowserNetworkDetector },
      ],
      exports: [NETWORK_DETECTOR],
    };
  }
}
```

Rules:

- `imports: [CoreModule.forRoot(options)]` — always compose core. Never
  duplicate its providers.
- Only add providers / imports the platform ADDS. Never redeclare tokens core
  already binds.
- `global: true` when the core module is global — so the platform's binding
  reaches services registered inside the imported core module.
- Class name: `Web<Name>Module` (web) / `Native<Name>Module` (native). File:
  `web-<name>.module.ts` / `native-<name>.module.ts`.
- Exposed via `react/index.ts` / `native/index.ts` (the subpath's public API
  barrel).

### Shape 2 — no platform module (hooks-only)

Use when the platform ONLY ships hooks / components / providers that consume
tokens core already bound. Just export the hooks; no module needed.

Examples in the workspace: `access-requests/react/`, `authorization/react/`,
`csp/react/`, `container/react/`, `dashboard/react/`, `events/react/`,
`logger/react/`, `monitoring/react/`. Consumers import
`<Name>Module.forRoot(...)` from `@stackra/<name>` at the app root and use
`@stackra/<name>/react`'s hooks directly.

### Forbidden — pass-through module

Never ship a platform module that just forwards to core:

```ts
// ❌ WRONG — pass-through adds no binding
@Module({})
export class WebXModule {
  public static forRoot(options: IXOptions): DynamicModule {
    return XModule.forRoot(options);
  }
}
```

`consent/react/web-consent.module.ts` currently ships this shape and is
explicitly `@deprecated` in its own docblock for the reason. It only adds noise
— the consumer's `WebXModule.forRoot(options)` call is byte-identical to
`XModule.forRoot(options)`. Choose Shape 1 or Shape 2; never a pass-through.

### Accepted exception — empty widget-scaffold `forFeature`

A `Web<Pkg>Module.forRoot(...)` MAY include a bare
`DashboardModule.forFeature({ widgets: [] })` import even when the array is
empty. This is NOT a pass-through violation, and NOT a Shape 1 binding either —
it's a scaffold slot that becomes a real Shape 1 contribution the moment the
package authors its first widget.

The pattern:

```ts
@Module({})
export class WebActionsModule {
  public static forRoot(options?: IActionsModuleOptions): DynamicModule {
    return {
      module: WebActionsModule,
      global: true,
      imports: [
        ActionsModule.forRoot(options),
        // Widget-scaffold slot — empty today; populate when this package
        // authors its first @Widget class. See `dashboard-widgets.md`
        // §Rule 2.
        DashboardModule.forFeature({ widgets: [] }),
      ],
      exports: [ActionsModule],
    };
  }
}
```

Why the exception is safe:

- **Zero runtime cost.** The dashboard registrar iterates the array once; an
  empty array is a single no-op iteration. No DI binding is redeclared, no
  widget class is instantiated.
- **`DashboardModule` is an optional peer**, so consumers who never mount
  `<DashboardShell>` never resolve the seed loader — the empty scaffold vanishes
  from their bundle.
- **The scaffold signals intent.** Reviewers reading `WebActionsModule.forRoot`
  can tell at a glance that this package IS wired for widget contributions and
  will grow real entries; there's no ambiguity about whether the wiring is
  missing or deferred.
- **It removes one friction step from the future author.** When a package adds
  its first `@Widget` class, they only add the import + array entry — they don't
  also have to remember to compose `DashboardModule.forFeature(...)` from
  scratch.

Scope of the exception:

- Applies ONLY to `DashboardModule.forFeature({ widgets: [] })` per
  [`dashboard-widgets.md` §Rule 2](./dashboard-widgets.md#rule-3--webxmoduleforroot-wires-widgets-via-forfeature)
  - [§"Retrofit note"](./dashboard-widgets.md#retrofit-note). The empty-widgets
    scaffold is codified across every user-facing package's `Web<Pkg>Module`.
- Does NOT extend to any other `.forFeature(...)` call — a
  `RoutingModule.forFeature({ routes: [] })` in a `Web<Pkg>Module` is still a
  pass-through violation and must be deleted until real routes land.
- Does NOT extend to `Web<Pkg>Module` classes that contain ONLY the empty
  scaffold and nothing else. If the ONLY contribution is
  `DashboardModule.forFeature({ widgets: [] })`, the module is still a
  pass-through — either add another DI binding (Shape 1) or delete the module
  entirely (Shape 2 with widgets registered lazily when the package grows its
  first widget class).

Empirical count as of 2026-07-26: **15 packages** carry the empty scaffold today
— `access-requests`, `actions`, `ai`, `analytics`, `collaboration`, `consent`,
`delegation`, `grants`, `invitations`, `monitoring`, `network`, `queue`, `rbac`,
`scheduler`, `sync`. Verify with
`grep -rE 'DashboardModule\.forFeature\(\{ widgets: \[\] \}\)' frontend/packages/*/src/react/*.module.ts`.
The audit's initial CROSS-014 finding named 7 packages; the pattern propagated
wider through subsequent Wave-3 sweeps.

Codified 2026-07-25 per CROSS-014 in the frontend-final-production-review
remediation.

## Rule — sub-domain composition (the routing exception)

`routing/` ships 10 subpaths: `core/`, `middleware/`, `guards/`, `seo/`,
`analytics/`, `matchers/`, `react/`, `testing/`, `vite/`, `console/`. The first
six are **sub-domain subpaths** — bounded contexts inside routing, not platform
variants. The last four are platform subpaths.

The composite `RoutingModule.forRoot(...)` in `core/routing.module.ts` composes
the six sub-domain modules via
`imports: [MiddlewareModule.forRoot(), GuardModule.forRoot(), SeoModule.forRoot(), AnalyticsModule.forRoot()]`.
This is legitimate — `core/` is the composition root that ties sub-domains
together.

Rules for sub-domain subpaths:

- Same tier as `core/` in the composition graph. Not below it.
- May be imported by `core/` (via `@/analytics/`, `@/guards/`, etc.).
- Never import from `react/`, `native/`, or any platform subpath.
- Each has its own `<name>.module.ts` that other sub-domains and `core/` can
  compose.
- Each has its own `package.json` `exports` subpath (`./middleware`, `./guards`,
  ...) so consumers who want fine-grained wiring can import them directly.

Sub-domain subpaths are RARE. Most packages have exactly one platform-agnostic
root (`core/`) and the sub-domain pattern is reserved for packages where the
domain naturally splits into peer bounded contexts. Adding a new sub-domain
subpath requires a design note in the package's README explaining why the domain
doesn't fit inside a single `core/`.

## Rule — external-renderer adapter subpaths (the routing pattern)

> **ADR anchor.** Codified by
> [ADR-0061](../../docs/adr/0061-native-routing-expo-router-adapter.md) —
> `@stackra/routing/native` composes with Expo Router rather than mounting its
> own React Navigation container.

Some subpaths adapt the workspace DI + hook surface on top of an EXTERNAL
renderer the app already owns. Two current examples, one per surface:

| Subpath                   | Owning workspace concern       | External renderer                                |
| ------------------------- | ------------------------------ | ------------------------------------------------ |
| `@stackra/routing/react`  | Routes registry + hook surface | React Router v7 (`<RouterProvider>` at app root) |
| `@stackra/routing/native` | Screen registry + hook surface | Expo Router (`app/**` file tree at app root)     |

The invariant: **the provider publishes DI context; it does NOT mount the
renderer.** The app itself mounts the renderer (React Router on web, Expo Router
on native); the workspace subpath layers on top of it via hooks that wrap the
renderer's imperative primitives.

### Concrete shape — the workspace's routing pair

Both `@stackra/routing/react` and `@stackra/routing/native` ship:

- A DI module (`RoutingModule.forRoot(...)` /
  `NativeRoutingModule.forRoot(...)`).
- A config-first authoring helper (`defineRoute(...)` / `defineScreen(...)`)
  that returns pure metadata records — routes / screens — the DI layer
  registers.
- A provider (`<StackraRoutingProvider>` / `<StackraNativeRoutingProvider>`)
  that publishes context (container + config + records) BUT does not mount
  `<RouterProvider>` / `<NavigationContainer>`.
- Navigate hooks (`useNavigate` / `useBack` / `useLocation` / `useSearchParams`)
  that wrap the external renderer's imperative primitives with a
  workspace-consistent shape so cross-platform code writes identically on both
  surfaces.

The tokens a `defineRoute(...)` / `defineScreen(...)` record carries (guards,
analytics tags, per-screen options, per-route SEO) are METADATA the DI layer
consumes; the record does NOT decide where the route mounts. Metadata plus
renderer plus hooks = the adapter contract.

### Why this shape

- **Two navigation containers explode.** Every renderer mounts its own
  navigation container. React Router mounts `<RouterProvider>`; Expo Router
  mounts `<NavigationContainer>` (from `@react-navigation/native`) at its own
  root. Attempting to wrap the renderer in a workspace-owned
  `<NavigationContainer>` triggers React Navigation's built-in guard — "another
  navigator is already registered for this container" — and the app crashes on
  first render.
- **The renderer already owns URL parsing, history, and linking.** Building a
  workspace-owned linking config from `defineScreen(...)` records would
  duplicate what Expo Router derives from `app.json` and the `app/` file tree.
  The workspace layer stays THIN — it registers metadata, not navigation state.
- **Consumers keep one mental model per surface.** Web writes `useNavigate`;
  native writes `useNavigate`. The workspace hooks are wire-format-identical
  even though React Router and Expo Router expose different primitives
  underneath.

### When it applies

- The subpath composes with a WELL-KNOWN external renderer per surface (React
  Router on web, Expo Router on native). Custom renderers get the Shape 1
  platform module treatment above.
- The workspace concern is renderer-adjacent (routes, guards, middleware,
  analytics, SEO) — never the renderer itself.
- Adding a new external-renderer adapter subpath requires an ADR that identifies
  (a) which external renderer it composes with, (b) which workspace hook surface
  it wraps, and (c) why a Shape 1 platform module couldn't have solved the same
  problem.

### Enforcement

- Zero `<NavigationContainer>` mounts in `@stackra/routing/native`. Confirmed by
  grep: `grep -rEn 'NavigationContainer' frontend/packages/routing/src/native/`
  returns zero hits.
- Zero `<RouterProvider>` mounts in `@stackra/routing/react`. Same shape.
- Every navigate hook that wraps a renderer's imperative primitive
  (`useNavigate`, `useBack`, `useLocation`, `useSearchParams`) matches the
  web-side hook's signature and error semantics.

## Rule — feature contributions (`forFeature`) live where the tokens they consume live

A `forFeature(...)` call registers a contribution against a base module's
tokens. Its home is determined by what the CONTRIBUTION consumes, not by where
the package's `core/` sits:

- **Platform-specific contribution** — routes with lazy React components, theme
  bindings, DOM adapters. Register from the platform module
  (`react/web-<name>.module.ts`), not from `core/`.
- **Platform-agnostic contribution** — a plain service extension, a token
  override, a schema registration, a subscriber that reads platform-agnostic
  events. Register from `core/`.

Examples:

- `RoutingModule.forFeature({ routes })` — ALWAYS platform-specific. Routes
  carry lazy React component refs. Feature packages that contribute routes
  register them from `react/`.
- `HttpModule.forFeature({ connections: { x: { baseURL } } })` — platform-
  agnostic. A named HTTP connection is just config. Register from `core/`.

## Rule — peer-dep classification follows the subpath

A package's `peer` / `dev` / `optional` dep classification must match which
subpath needs each dep.

- If a dep is required by `core/`, it's a required peer of the `.` entry (no
  `peerDependenciesMeta.<dep>.optional`).
- If a dep is only required by `react/`, it's an OPTIONAL peer at the package
  level + declared under `peerDependenciesMeta`. Common pattern for `react`,
  `react-dom`, `@stackra/routing`, `@stackra/ui`, `@stackra/heroui`.
- If a dep is only required by `native/`, same as `react/` but for RN-specific
  packages (`react-native`, `@react-native-community/netinfo`).
- If a dep is only required by `testing/` or `vite/`, same rule — optional peer.

Enforced by review. The move-to-optional-peer step is REQUIRED when migrating a
`forFeature` block from `core/` to `react/` — the base module goes from "hard
dependency" to "optional" the moment the react-only consumer becomes the sole
caller.

## Enforcement greps

Zero-hit greps that must pass:

```sh
# Core importing from any sibling platform / consumer subpath.
grep -rEn 'from ["'"'"'](@|\.\.?)/(react|native|testing|vite|console|actions)/' \
  frontend/packages/*/src/core/

# React importing from native.
grep -rEn 'from ["'"'"'](@|\.\.?)/native/' \
  frontend/packages/*/src/react/

# Native importing from react.
grep -rEn 'from ["'"'"'](@|\.\.?)/react/' \
  frontend/packages/*/src/native/

# Testing / vite / console importing from react or native.
grep -rEn 'from ["'"'"'](@|\.\.?)/(react|native)/' \
  frontend/packages/*/src/testing/ \
  frontend/packages/*/src/vite/ \
  frontend/packages/*/src/console/
```

Sub-domain composition greps (permitted, not violations):

- `routing/core/routing.module.ts` importing `@/analytics/`, `@/guards/`,
  `@/middleware/`, `@/seo/` — sub-domain composition, explicitly allowed.
- Any other package that declares a sub-domain layout in its README and composes
  from `core/`.

## Anti-patterns

| Anti-pattern                                                                     | Fix                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core/x.module.ts` imports from `@/react/routes/build-x-routes.util`             | Move `RoutingModule.forFeature({ routes })` to `react/web-x.module.ts`.                           |
| `core/hooks/use-x.hook.ts` re-exports a type from `@/react/interfaces`           | The type belongs in `core/interfaces/`; `react/interfaces` re-exports FROM core, not vice versa.  |
| Platform module that only forwards to core                                       | Delete it, or make it Shape 1 by adding an actual binding. See `WebConsentModule` — deprecated.   |
| A subpath's `.module.ts` re-declaring tokens core already bound                  | Remove the duplicate. Core owns the token; platform adds `useClass` / `useExisting` / `useValue`. |
| `@stackra/routing` as a required peer on a package whose ONLY routes are `react` | Move to `optional` + declare in the react subpath's peer-deps.                                    |
| `vite/x.util.ts` imports `@/react/y.util.ts` for build-time processing           | Move the shared logic to `core/` if it's pure data; duplicate to a Node-safe path otherwise.      |

## Cross-references

- `code-standards.md` — where files live inside a subpath (folder taxonomy,
  suffix-per-kind naming, one-export-per-file, per-folder barrels).
- `package-conventions.md` — module + config trio, manager base classes,
  `forFeature` seed loaders.
- `ui-components.md` — react subpath's folder layout, `IconType`, the "no
  bespoke class names" rule.
- `contract-reexports.md` — what a subpath may re-export.
- `browser-safe-imports.md` — the sibling runtime-safety rule (a subpath in the
  browser-loaded surface must never touch `node:*`).
- `module-lifecycle.md` — `OnModuleInit` / `OnApplicationBootstrap` seams.
- `discovery-vs-loader.md` — how discovery-based fan-out registers across
  subpaths.
