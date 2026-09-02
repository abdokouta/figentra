# Package Conventions

The standard shape every `@stackra/*` **module package** follows. Read alongside
`module-lifecycle.md` (lifecycle hooks), `contract-reexports.md` (what a package
may export), and `ui-components.md` (React UI packages).

"Module package" = a package that ships a DI module with a static `forRoot`.
Vocabulary-only packages (`contracts`), base utilities (`support`, `testing`),
and the DI framework (`container`) are exempt from the module/config rules
below.

## Scaffold

Every package has, at minimum:

- `package.json` — `publishConfig.access: public`, `engines.node >= 22`,
  `main`/`module`/`types`, an `exports` map (`.`, plus `./react`, `./testing`,
  and other subpaths as needed), `files: ["dist", "LICENSE", "README.md"]`, and
  the standard scripts
  (`build`/`dev`/`clean`/`typecheck`/`test`/`test:watch`/`test:coverage`).
- `tsconfig.json` extending `../tsconfig.base.json` with
  `paths: { "@/*": ["./src/*"] }`.
- `tsup.config.ts` via `defineBaseConfig({ index: 'src/core/index.ts', ... })`.
- `vitest.config.ts` merging `@stackra/testing/preset`.
- `README.md`.
- `src/core/index.ts` — the public API (package-owned symbols only).

## Frontend tooling standards

Every workspace TypeScript package converges on the same three build / test
manifests. The workspace ships shared presets under `frontend/packages/config/*`
(in the frontend workspace) — use them; do not hand-roll.

Read alongside `subpath-layering.md` (which decides WHICH subpaths a package
ships) and `catalog-manifest.md` (which decides how those subpaths are
advertised in `catalog.json`).

### `tsup.config.ts` — canonical shape

Import `defineBaseConfig` from `@stackra/tsup-config` and pass the entry map
(one entry per publishable subpath) + optional overrides. Every subpath in
`package.json.exports` MUST have a matching entry here.

```ts
// frontend/packages/<name>/tsup.config.ts
import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // package-specific overrides (rare)
  },
);
```

Rules:

- Entry key names are the lowercase subpath slug (`index`, `react`, `native`,
  `testing`, `vite`, `console`). Never PascalCase, never suffixed.
- Every entry points at a `src/<slug>/index.ts` barrel.
- Do NOT redeclare `dts`, `format`, `sourcemap`, `clean` — the base sets them
  (`dts: true`, `format: ["esm", "cjs"]`, `sourcemap: true`, `clean: true`).
- Package-specific overrides go in the second argument to `defineBaseConfig`,
  kept minimal.

### `vitest.config.ts` — canonical shape

Merge the workspace preset from `@stackra/testing/preset` with any
package-specific config.

```ts
// frontend/packages/<name>/vitest.config.ts
import preset from "@stackra/testing/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      // package-specific overrides (rare)
    },
  }),
);
```

Rules:

- Packages that ship React components use jsdom:
  `test: { environment: "jsdom" }`.
- Packages that use `@stackra/container` or `@stackra/decorators/*` decorator
  metadata MUST turn off vitest 4's default transformers so SWC handles emit
  correctly: `test: { oxc: false, esbuild: false }`. Comment the reason inline —
  the reason isn't obvious from the code.
- Do NOT redeclare `coverage.provider`, `include`, `exclude`, or reporters — the
  preset owns them.

### `tsconfig.json` — canonical shape

Extend the workspace base and set `paths` so `@/*` resolves to `./src/*`.

```json
{
  "extends": "@stackra/typescript-config/base",
  "compilerOptions": {
    "types": ["node"],
    "rootDir": ".",
    "paths": { "@/*": ["./src/*"] },
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

Rules:

- Always `extends: "@stackra/typescript-config/base"`. Never redeclare `strict`,
  `target`, `module`, `moduleResolution`, `esModuleInterop`, or `skipLibCheck` —
  the base owns them.
- Always `"paths": { "@/*": ["./src/*"] }` — every alias import uses this shape
  (see `subpath-layering.md`).
- Include `"types": ["node"]` ONLY when the package uses `node:*` in a Node-only
  subpath (build tooling, tests). Do NOT include `node` for a browser-only
  package (per `browser-safe-imports.md`).
- `__tests__` is EXCLUDED from the build `include` — tests are compiled by
  vitest, not by tsup.

### `package.json` — canonical shape

Beyond the fields already documented under Scaffold, every FE package converges
on:

- `"sideEffects": false` — tree-shakable by default.
- `"engines": { "node": ">=22.0.0" }`.
- `"publishConfig": { "access": "public" }` — every `@stackra/*` package is
  public.
- `"main": "./dist/index.js"`, `"module": "./dist/index.mjs"`,
  `"types": "./dist/index.d.ts"` — legacy resolver fallbacks alongside the
  modern `exports` map.
- `"exports"` map — one entry per subpath, each with the
  `{ types, import, require }` triple pointing at `dist/<slug>.d.ts` /
  `dist/<slug>.mjs` / `dist/<slug>.js`.
- `"files": ["dist", "LICENSE", "README.md"]` — plus `"src/core/i18n"` when the
  package ships i18n catalogs the runtime reads at build time, plus `"config"`
  when the package ships a publishable config template.
- `"scripts"` — the canonical set: `build` (tsup), `dev` (tsup --watch), `clean`
  (rimraf dist .turbo), `typecheck` (tsc --noEmit), `test` (vitest run
  --passWithNoTests), `test:watch`, `test:coverage`.

### Dependency classification (pnpm workspace + peer contract)

The workspace uses **npm overrides** for pinned third-party versions +
`workspace:` protocol for internal deps. Every dep in a `@stackra/*` package
MUST use one of the four shapes below, picked by role.

| Shape         | Where                                               | Meaning                                                                                            |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `catalog:`    | `peerDependencies`, `devDependencies` — third-party | Version pinned in the root `package.json workspaces` `catalog:` block. Bumps once, ripples everywhere. |
| `workspace:^` | `peerDependencies` — internal `@stackra/*`          | Consumer tracks a caret range against the peer's current major.                                    |
| `workspace:*` | `devDependencies` — internal `@stackra/*`           | Consumer tracks the workspace floor. Used for build-time deps (`@stackra/tsup-config`, ...).       |
| bare version  | (avoid)                                             | Hand-pinned. Only when the dep isn't in the catalog AND isn't internal — rare.                     |

### `peerDependencies` + `peerDependenciesMeta` — the required / optional split

Peer classification follows the subpath consumption (see `subpath-layering.md`
§"Peer-dep classification"):

- If a dep is required by `core/`, it's a REQUIRED peer of the `.` entry. No
  entry in `peerDependenciesMeta`.
- If a dep is only required by `react/`, `native/`, `testing/`, `vite/`, or
  `console/`, it's an OPTIONAL peer + declared under `peerDependenciesMeta` with
  `{ optional: true }`.

```jsonc
{
  "peerDependencies": {
    // Required by core — every consumer needs this.
    "@stackra/container": "workspace:^",
    "@stackra/contracts": "workspace:^",
    "@stackra/support": "workspace:^",
    "reflect-metadata": "catalog:",

    // Only required by react/ — consumers that skip the react subpath
    // don't need to install these.
    "react": "catalog:",
    "@stackra/ui": "workspace:^",

    // Only required by native/ — same story.
    "react-native": "*",
    "@react-native-community/netinfo": "*",

    // Only required by testing/ — same story.
    "@stackra/testing": "workspace:^",
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-native": { "optional": true },
    "@react-native-community/netinfo": { "optional": true },
    "@stackra/ui": { "optional": true },
    "@stackra/testing": { "optional": true },
  },
}
```

Rules:

- **`react` + `react-dom`** always `catalog:`. Optional when only the react
  subpath needs them.
- **`react-native` + native peers** always use `"*"` and are optional when only
  the native subpath needs them.
- **Every `@stackra/*` peer** uses `workspace:^` — never `workspace:*` (which is
  for devs).
- **`@stackra/testing`** is optional-peer + `workspace:^` when the package ships
  a `./testing` entry.

### `devDependencies` — mirror every peer

Every peer dep MUST also appear in `devDependencies` — pnpm requires it for the
package to type-check + build from source in the workspace. Convention: internal
`@stackra/*` peers use `workspace:*` in devDeps (not `workspace:^`); third-party
peers use `catalog:`.

```jsonc
{
  "devDependencies": {
    // Mirror every peer with the workspace-floor shape.
    "@stackra/container": "workspace:*",
    "@stackra/contracts": "workspace:*",
    "@stackra/support": "workspace:*",
    "@stackra/testing": "workspace:*",
    "@stackra/ui": "workspace:*",
    "reflect-metadata": "catalog:",
    "react": "catalog:",
    // Build tools — always workspace:* + catalog:.
    "@stackra/typescript-config": "workspace:*",
    "@stackra/tsup-config": "workspace:*",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "rimraf": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
  },
}
```

Rules:

- **Every peer dep is mirrored** in devDependencies.
- **No `dependencies` block** — `@stackra/*` packages have zero runtime
  dependencies; every runtime consumer is a peer. **CLI / build-tooling
  exception applies** — see the ADR-0051 subsection immediately below.
- **No `optionalDependencies` block** — Node's `optionalDependencies` is
  orthogonal to `peerDependenciesMeta.optional`; the workspace uses only the
  latter.

### `dependencies` block — CLI / build-tooling exception (ADR-0051)

> **ADR anchor.** Codified by
> [ADR-0051](../../docs/adr/0051-cli-package-dependencies-exception.md).

A package MAY declare a `dependencies` block ONLY when it meets EVERY criterion
below. The exception exists because CLI runtimes and build-tool presets are
runtime executables — they resolve their own deps at invocation time and their
consumers never `import` from them, so peer-dep semantics buy nothing and force
every consuming app to install internal tooling deps.

1. The package is a CLI runtime (ships an executable `bin` entry in
   `package.json`), a build-tool preset (Vitest preset, tsup preset), or an
   equivalent runtime-executable. **This is the load-bearing gate — a package
   that does not ship a `bin` entry AND is not a build-tool preset cannot
   qualify regardless of any other criterion.**
2. Every dep in the `dependencies` block is CLI-time / build-time, never a
   runtime dep of the CONSUMER's app (never React, never HeroUI, never a
   data-layer library).
3. Every dep's role is documented in the package's README under a §"Runtime
   dependencies" section, naming which CLI command or preset hook consumes it.
4. The package's `catalog.kind` is one of `tooling`, `starter`, `feature`, or
   `framework-plumbing`. Criterion 1 is the qualifier; `catalog.kind` is a
   secondary label check. See ADR-0051 §"Amendment — criterion 4 enum widening"
   for the rationale — `feature` covers packages that ship user-facing CLI verbs
   (`@stackra/console`), and `framework-plumbing` covers build-tool presets
   (`@stackra/testing`).

As of ADR-0051 (as amended 2026-07-25), exactly two packages take the exception:

- **`@stackra/console`** — 6 CLI runtime deps (`@clack/prompts`, `boxen`,
  `cli-table3`, `ejs`, `picocolors`, `terminal-link`). `catalog.kind`:
  `"feature"`.
- **`@stackra/testing`** — 2 build-tooling deps (`@swc/core`, `unplugin-swc`).
  `catalog.kind`: `"framework-plumbing"`.

Every entry uses the `catalog:` protocol so version drift is impossible.

Adding a third grandfathered package requires a new ADR (or an amendment to
ADR-0051) arguing the four criteria in the PR description.

### `.turbo` cache

`.turbo` is a build cache. Every package tolerates its presence but never
commits it (`.gitignore` covers it).

### Release flow — publishing a new `@stackra/*` version

Every `@stackra/*` package publishes via **CI on tag push** — never
`npm publish` from a workstation. Two shapes:

**Single-package repos** (`eslint-config`, `prettier-config`,
`typescript-config`, `tenancy`, `tsup-config`, `scope`): one project = one
publishable. Flow:

1. Bump `version` in `package.json`.
2. `git commit && git push`.
3. `git tag v1.2.3 && git push origin v1.2.3`.
4. GitLab CI (`.gitlab-ci.yml`) picks up the tag, runs
   `npm install --frozen-lockfile && npm run build && pnpm publish`.

**Mega-repo publishes** (`framework`, `identity`, `platform`, `notifications`,
`ai`): one project hosts N nested `@stackra/*` under `src/*`. Same flow, but
`pnpm -r` fans out to every subpackage:

1. Bump `version` on the subpackages you want to release (or all — pnpm's
   `pnpm -r publish` respects each subpackage's `publishConfig.registry`).
2. `git commit && git push`.
3. `git tag v1.2.3 && git push origin v1.2.3`.
4. CI runs
   `npm install --frozen-lockfile && pnpm -r run build && pnpm -r publish --no-git-checks --access=public`.

**Mega-repo prerequisites** (codified by Bucket K, 2026-08-07):

- `package.json workspaces` at repo root with `packages: - "src/*"`, a `catalog:`
  block (third-party versions from mobile's lockfile — workspace-wide source of
  truth), `allowBuilds:` for postinstall scripts, `overrides:` for peer-dep
  pinning, `minimumReleaseAgeExclude: - "@stackra/*"`.
- Root `package.json` self-refs to workspace subpackages use `workspace:*`;
  cross-repo `@stackra/*` peers use pinned `^1.0.X` versions from the group
  registry.
- Subpackages' `tsup.config.ts` sets `dts: false` (upstream `@heroui/react`
  ships broken `exports.types`).
- Subpackages that import `@stackra/dashboard` (cross-repo) declare it in
  `peerDependencies` + `peerDependenciesMeta.<name>.optional: true`.
- `pnpm-lock.yaml` committed to the repo root.
- `.gitlab-ci.yml` consumer-side `.npmrc` uses `$STACKRA_GITLAB_TOKEN` (a masked
  CI variable — a PAT scoped to the stackra group) with catch-all auth patterns
  (`//gitlab.com/api/v4/groups/…`, `//gitlab.com/api/v4/projects/`,
  `//gitlab.com/`) so pnpm's per-project URL caching in the lockfile resolves
  during install.
- `.gitlab-ci.yml` publish stage runs `npm install --frozen-lockfile` in its
  `before_script` so `workspace:*` self-refs resolve to real versions at
  `pnpm -r publish` time.
- `.npmrc` (with the token) is gitignored — CI generates it fresh from the CI
  variable.

### Enforcement

The `frontend-package-auditor` sub-agent walks these standards per package.
Common failures the auditor flags:

- Hand-rolled `tsup.config.ts` that duplicates what `defineBaseConfig` ships.
- `vitest.config.ts` that redeclares coverage config.
- `tsconfig.json` that duplicates strict-mode options from the base.
- Missing `"sideEffects": false`.
- `exports` entry that doesn't match a `tsup.config.ts` entry.
- `exports` entry present but no `catalog.surfaces` entry (per
  `catalog-manifest.md`).
- Peer without a matching devDep.
- `dependencies` block on a package that fails ADR-0051 criterion 1 (no `bin`
  entry AND not a build-tool preset) — P1 (see the ADR-0051 exception subsection
  above). A `dependencies` block on a qualifying package with a missing README
  §"Runtime dependencies" section — P2.
- Third-party dep pinned with a bare version instead of `catalog:`.
- Internal peer using `workspace:*` instead of `workspace:^`.
- Internal devDep using `workspace:^` instead of `workspace:*`.

## Config authoring

> **ADR anchor.** Codified by
> [ADR-0063](../../docs/adr/0063-unified-di-first-config-pattern.md) — Unified
> DI-first config pattern. Every rule below is enforceable; changing a rule
> means amending the ADR.
>
> **Amendment anchor** (2026-07-29). The ConfigScope model amendment lives at
> [ADR-0063 §Amendment — ConfigScope model](../../docs/adr/0063-unified-di-first-config-pattern.md#amendment--configscope-model-2026-07-29).
> The amendment kills `mergeAs` + the boolean overlay marker, introduces the
> `ConfigScope` enum in `@stackra/contracts`, and adds one step to Rule 4's
> canonical framework-side shape: every `<Pkg>Module.forRoot()` self-registers
> its `<pkg>.config.ts` factory via
> `ConfigModule.forFeature(<pkg>Config, { scope: ConfigScope.Baseline })` in its
> `imports` array so the app never needs to include the framework baseline in
> its own `ConfigModule.forRoot({ load })` list. The four Rules below remain the
> enforceable surface; the self-registration import is reflected in the
> canonical shape example.

Every `@stackra/*` framework package that accepts runtime configuration ships
the SAME four artefacts — one interface, one factory, one token, one module
method. No exceptions, no legacy escape hatch.

### The four artefacts per package

1. **One `I<Pkg>ModuleOptions` interface** — the ONLY config shape. Every
   optional field carries a documented default that the factory (rule 2)
   supplies. No `IResolved<Pkg>Config`, no `I<Pkg>ConfigInternal`, no
   `I<Pkg>MergedConfig` variant.

2. **One `<pkg>Config` factory** — file at
   `frontend/packages/<pkg>/config/<pkg>.config.ts` (package root, sibling of
   `src/`, `LICENSE`, `README.md`). Uses
   `registerAs<I<Pkg>ModuleOptions>(<X_CONFIG>, () => ({...defaults inline...}))`.
   The factory returns the FULL populated shape (every optional field has a
   concrete default). NO separate `mergeConfig(options)` step, NO
   `DEFAULT_X_CONFIG` constant, NO `defineConfig(...)` alias.

   **Location** — package root `config/` folder, NEVER `src/core/config/`. The
   `config/` sibling keeps the runtime factory next to the package root:
   consumers `import { xConfig } from "@stackra/<pkg>/config"` (via the
   `./config` subpath export) OR copy the file into their own
   `apps/<app>/src/config/<pkg>.config.ts` for full customization.

   **Docblocks** — every field authored with a banner-style
   `|--------------------------------------------------------------------------`
   block comment describing the field's role. Uses `env(...)` calls from
   `@stackra/config` so consumers get env-driven overrides for free. See any
   existing `frontend/packages/<pkg>/config/<pkg>.config.ts` for reference
   (auth, kbd, cache, settings, and others already ship this shape).

3. **One `X_CONFIG` string constant** in `@stackra/contracts`:

   ```ts
   // frontend/packages/contracts/src/tokens/auth.tokens.ts
   export const AUTH_CONFIG = "auth" as const;
   ```

   Token name is SCREAMING_SNAKE_CASE (workspace DI-token convention); token
   value is lowercase kebab-case (NestJS-canonical namespace convention).
   Services `@Inject(AUTH_CONFIG)` — same DI slot as `@Inject("auth")`.

4. **One `<Pkg>Module.forRoot(options?)` signature** — dual-mode. When `options`
   is provided (legacy static path), binds `X_CONFIG` from options at
   module-build time. When `options` is omitted (canonical DI-first path),
   trusts the consumer app's `ConfigModule.forRoot({ load: [<pkg>Config] })` to
   have registered a factory under the namespace, and wires named HTTP
   connections via `HttpModule.forFeatureAsync({ inject: [X_CONFIG] })`.

### Canonical framework-side shape

```ts
// frontend/packages/auth/config/auth.config.ts
/**
 * @file auth.config.ts
 * @module @stackra/auth/config
 * @description Consumer template for the auth module's namespaced
 *   configuration factory.
 */

import { env, registerAs } from "@stackra/config";
import { AUTH_CONFIG } from "@stackra/contracts";

import type { IAuthModuleOptions } from "@stackra/auth";

export const authConfig = registerAs<IAuthModuleOptions>(AUTH_CONFIG, () => ({
  /*
  |--------------------------------------------------------------------------
  | Application Name
  |--------------------------------------------------------------------------
  |
  | Human-readable name surfaced in default form copy — welcome
  | banners, page titles, email-from strings.
  |
  */
  appName: env("APP_NAME", "App"),

  /*
  |--------------------------------------------------------------------------
  | API Endpoint
  |--------------------------------------------------------------------------
  |
  | Base URL + request timeout for every auth-related HTTP call
  | (login, register, refresh, reset).
  |
  */
  api: {
    baseURL: env("AUTH_BASE_URL", "/api/auth"),
    timeout: env.number("AUTH_TIMEOUT_MS", 30_000),
  },

  // … every optional field of IAuthModuleOptions carries a `|-|-|`
  // docblock followed by an env()-driven default.
}));
```

```ts
// frontend/packages/auth/src/core/auth.module.ts
import { ConfigModule } from "@stackra/config";
import { AUTH_CONFIG, ConfigScope } from "@stackra/contracts";
import { authConfig } from "../../config/auth.config";

@Module({})
export class AuthModule {
  public static forRoot(options?: IAuthModuleOptions): DynamicModule {
    if (options !== undefined) {
      // Static path — LAST WINS binding overrides any app-side factory.
      // Self-register the framework baseline first so string-path
      // lookups (`ConfigService.get('auth')`) still resolve; the
      // static options bind under AUTH_CONFIG as a LAST-registered
      // `useValue` provider, which wins over the baseline for
      // per-inject reads.
      return {
        module: AuthModule,
        global: true,
        imports: [
          ConfigModule.forFeature(authConfig, { scope: ConfigScope.Baseline }),
          buildAuthConnection(options),
        ],
        providers: [
          { provide: AUTH_CONFIG, useValue: options },
          ...buildCommonProviders(),
        ],
        exports: buildCommonExports(),
      };
    }

    // DI-first path — self-register the framework baseline; app-side
    // factories loaded via `ConfigModule.forRoot({ load })` deep-merge
    // on top and win per field.
    return {
      module: AuthModule,
      global: true,
      imports: [
        ConfigModule.forFeature(authConfig, { scope: ConfigScope.Baseline }),
        HttpModule.forFeatureAsync({
          useFactory: (config: IAuthModuleOptions) => ({
            connections: { auth: { baseURL: config.api.baseURL, ... } },
          }),
          inject: [AUTH_CONFIG],
        }),
      ],
      providers: buildCommonProviders(),
      exports: buildCommonExports(),
    };
  }
}
```

### Canonical app-side shape

```ts
// apps/<app>/src/config/auth.config.ts
import { registerAs, env } from "@stackra/config";
import { AUTH_CONFIG } from "@stackra/contracts";

import type { IAuthModuleOptions } from "@stackra/auth";

export const authConfig = registerAs<IAuthModuleOptions>(AUTH_CONFIG, () => ({
  appName: env("APP_NAME", "App"),
  api: {
    baseURL: env("AUTH_BASE_URL", "/api/auth"),
    headers: {},
    timeout: env.number("AUTH_TIMEOUT_MS", 30_000),
  },
  minPasswordLength: env.number("AUTH_MIN_PASSWORD_LENGTH", 8),
  otpLength: env.number("AUTH_OTP_LENGTH", 6),
  mfaProvider: env("AUTH_MFA_PROVIDER", "totp"),
  // … same shape as the framework factory, env-driven where operators want it.
}));
```

```ts
// apps/<app>/src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [authConfig, ...] }),
    NativeAuthModule.forRoot(),  // zero-arg — DI-first
  ],
})
export class AppModule {}
```

The app's factory registers under `AUTH_CONFIG` (same namespace as the
framework's factory). NestJS's last-registered wins at the DI provider level —
the app's env-driven values reach every service that `@Inject(AUTH_CONFIG)`.

### Forbidden

- **`DEFAULT_<NAME>_CONFIG` constants** — defaults live inline in the factory.
- **`defineConfig(...)` aliases** — consumers use `registerAs` from
  `@stackra/config` directly.
- **`mergeConfig(options)` utilities** — the factory IS the merge; there is no
  "raw options" vs "resolved config" distinction.
- **`IResolved<Pkg>Config` / `I<Pkg>ConfigInternal` variants** — one interface
  per package.
- **Default-parameter expressions in `forRoot`**
  (`forRoot(options: IXModuleOptions = xConfig())`) — this bypasses DI
  resolution. See `.kiro/plans/di-first-config-migration.md` §"Discovered gap".
- **String-literal namespace at `registerAs('name', …)` sites in framework
  packages** — always import the `X_CONFIG` constant from `@stackra/contracts`.
  App-side is grandfathered but discouraged for the same reason (source-code
  searchability).

### Enforcement

The `frontend-package-auditor` sub-agent gains a §15 audit walk-through that
greps for the compliance rules from ADR-0063. Zero-hit greps:

- `grep -rl 'export function mergeConfig\|export const mergeConfig' frontend/packages/*/src/`
  — zero (except `@stackra/config`'s own `merge-config-object.util.ts` which is
  a package-internal helper, distinct name).
- `grep -rE '^export const DEFAULT_\w+_CONFIG' frontend/packages/*/src/core/constants/`
  — zero.
- `grep -rl 'export const defineConfig\|export function defineConfig' frontend/packages/*/src/`
  — zero (except `@stackra/config`'s own re-export).
- `grep -rE 'IResolved\w+Config|I\w+ConfigInternal|I\w+Merged' frontend/packages/*/src/core/`
  — zero.
- `grep -rE 'forRoot\(options.*=.*Config\(\)\)' frontend/packages/*/src/` — zero
  (the "default-arg bypass" anti-pattern).

### Normalisation

If a package needs to prune `enabled: false` instances or filter a `stack` list
down to survivors, do it in the manager's constructor as a private
`normalizeConfig(input)` method — NOT in a public `mergeConfig` util. Managers
are the natural home for runtime-state normalisation; the factory handles static
defaults.

## Manager base — pick the right one

From `@stackra/support`:

- **`Manager<T>`** — one active driver, switchable (logger channels, auth).
  `driver(name)`.
- **`MultipleInstanceManager<T>`** — N independently-configured named instances
  (cache, queue, http, **monitoring, analytics**). `instance(name)`,
  `create{Driver}Driver(config)` convention, `extend(driver, creator)`.

**Fan-out** (dispatch one call to many providers — monitoring, analytics) is a
facade layered on `MultipleInstanceManager`: iterate the active set (configured
`stack` ∪ ad-hoc registered), never a bespoke flat registry. A throwing provider
must be isolated (`try/catch` per provider).

## `forFeature` — always via an `@Injectable()` registrar class

> **ADR anchor.** Codified by
> [ADR-0052](../../docs/adr/0052-forfeature-registrar-class-pattern.md).

Never run a side effect in a `useFactory` — regardless of whether the factory
returns a sentinel (`return null` / `return true`) or a lifecycle-hook object.
`useFactory` is documented to produce the VALUE consumed under the token;
nothing here ever injects that token.

The canonical shape declares an inline `@Injectable()` class implementing
`OnApplicationBootstrap` INSIDE the `forFeature` method body, and adds it to
`providers` as a bare class:

```ts
static forFeature(driver: string, Cls: Type<T>): DynamicModule {
  @Injectable()
  class XFeatureRegistrar implements OnApplicationBootstrap {
    public constructor(
      @Inject(X_MANAGER) private readonly manager: XManager,
      private readonly moduleRef: ModuleRef,
    ) {}

    public onApplicationBootstrap(): void {
      const instance = this.moduleRef.get<T>(Cls);
      if (instance) this.manager.extend(driver, () => instance);
    }
  }

  return {
    module: XModule,
    providers: [Cls, XFeatureRegistrar],
    exports: [Cls],
  };
}
```

Each call to `forFeature` creates a fresh class object. The container tracks
providers by class identity, so multiple `forFeature` contributions never
collide — no synthetic tokens, no `Symbol()` factory.

ADR-0052 documents the four canonical variants:

- **`(driver, Class)`** — cache / queue / realtime pattern. Registrar uses
  `ModuleRef.get(Cls)` to resolve the consumer-supplied class at bootstrap.
- **`Type<X> | Type<X>[]`** — notifications / analytics / monitoring pattern.
  Same `ModuleRef.get(...)` shape, one lookup per class.
- **`(driver, factory)`** — storage pattern. Factory is closure-captured; no
  `ModuleRef` needed (just inject the manager).
- **Options-shape** — routing / kbd / dashboard / sdui / i18n / etc. Registrar
  closes over the options object; inject registries directly.

### Legacy `createSeedLoader` pattern (retired 2026-07-28)

Before ADR-0052, `forFeature` seeding routed through `createSeedLoader(fn)` +
`seedLoaderToken(name)` from `@stackra/support`. Session 3 of the ADR-0052
rollout landed on 2026-07-28: every package migrated to the registrar-class
shape above, the helpers were deleted from `@stackra/support`, and
`@stackra/csp` dropped its back-compat re-export in a major bump.

**New code must NEVER use `createSeedLoader` / `seedLoaderToken`.** Zero hits
are allowed across the workspace — enforced by the grep in `module-lifecycle.md`
§Enforcement.

## Auto-registration — decorator + loader

Discoverable contributors (stores, reporters, providers, processors) use a class
decorator that stamps a metadata key + a loader service that scans the container
and registers them.

- The loader queries **`discovery.getProvidersByMetadata(METADATA_KEY)`** — not
  `getProviders()` + manual `getMetadata` filtering.
- `OnModuleInit` when seeding the service's own state; `OnApplicationBootstrap`
  when scanning other modules (discovery).
- Import `IDiscoveryService` from `@stackra/contracts` — do not redeclare it.

## Contracts

Import tokens/interfaces from `@stackra/contracts` directly; new packages do not
re-export them (see `contract-reexports.md`).

---

## Conformance backlog (as of the standardization sweep)

**Completed:**

- `class *Bootstrap` — 0 hits (eradicated).
- `forFeature` return-`null` side-effect factories — every `forFeature` in the
  workspace now returns a `DynamicModule` whose `providers` include an inline
  `@Injectable()` registrar class implementing `OnApplicationBootstrap`
  (ADR-0052 Session 3, 2026-07-28).
- `createSeedLoader` / `seedLoaderToken` retired — the helpers were deleted from
  `@stackra/support` and `@stackra/csp`'s back-compat re-export was dropped in
  the corresponding major bump.
- Discovery loaders switched to `getProvidersByMetadata` across analytics,
  monitoring, queue, cache, scheduler, and events.
- All `*_CONFIG` / `*_OPTIONS` tokens in `@stackra/contracts` migrated from
  `Symbol.for(...)` to `<name>` lowercase string constants (Phase 1 of ADR-0063,
  commit `83a48d66f`). `getConfigToken` is pass-through — no
  `CONFIGURATION(...)` wrapping.
- `HttpModule.forFeatureAsync` shipped — enables true DI-first HTTP connection
  registration from framework modules.

**In flight — ADR-0063 unified config migration:**

Every `@stackra/*` framework package converges on the pattern documented in
§"Config authoring" above. Migration status tracked in
`.kiro/plans/di-first-config-migration.md`. The remaining packages ship the
legacy trio (`DEFAULT_*_CONFIG` + `defineConfig` + `mergeConfig`); each PR that
touches a package MUST bring it into ADR-0063 compliance before merging.

Grep target for the remaining migration wave:

```sh
grep -rl 'export function mergeConfig\|export const mergeConfig' frontend/packages/*/src/
```

**Intentional exceptions (not to be "fixed"):**

- **`@stackra/container` DI re-export.** It re-exports the DI foundation
  vocabulary (`Type`, `Provider`, `DynamicModule`, lifecycle hooks, `Scope`)
  from `@stackra/contracts`. This is deliberate — the DI framework re-exporting
  DI primitives, à la `@nestjs/common`; every module imports
  `Module`/`DynamicModule` from it. Keep it. `contract-reexports.md` targets
  _feature_ packages leaking _domain_ tokens, not this.
- **`@stackra/config`'s internal `mergeConfigObject`** — package-private helper
  used by the ConfigModule to merge namespaces into the internal host record.
  Distinct from the pattern-A `mergeConfig` util the ADR-0063 grep targets;
  compliant because it's not exported.

**Still divergent — address per ADR-0063 waves:**

- **Feature-package contract re-exports** — the pre-rule grandfathered set
  (`logger`, `queue`, `cache`, `events`, `realtime`, `scheduler`, `coordinator`,
  `collaboration`, `ssr`) still re-export their domain contracts; remove
  per-package with a minor bump + changeset when touched (per
  `contract-reexports.md`).
