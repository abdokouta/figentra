# Frontend package audit checklist

The master per-package audit checklist for every `@stackra/*` frontend package.
Reviewers walk this doc top to bottom against a target package; the
`frontend-package-auditor` sub-agent walks it programmatically and emits
reports.

Every check names the steering doc that owns the rule, so the reader can drill
down without opening this doc's inline paraphrase.

Read alongside:

- `subpath-layering.md` — the core layering contract.
- `code-standards.md` — folder taxonomy, one-export-per-file, barrels.
- `package-conventions.md` — module + config trio + tooling standards.
- `catalog-manifest.md` — `catalog.json` shape.
- `frontend-localization.md` — per-package i18n.
- `contract-reexports.md` — what a subpath's public API may re-export.
- `browser-safe-imports.md` — Node-safe browser bundles.
- `contracts-and-decorators-promotion.md` — when symbols move to
  `@stackra/contracts` / `@stackra/decorators`.
- `documentation.md` — docblocks on every file + export.
- `ui-components.md` — React subpath rules.

## How to use this doc

- **As a reviewer** — walk each section top to bottom against the target
  package. Flag every unchecked item. Report goes into a PR comment or
  `.kiro/reports/audit-<pkg>-<date>.md`.
- **As the auditor agent** — the `frontend-package-auditor` sub-agent reads this
  doc + the target package's `src/`, runs every enforcement grep in each
  referenced steering doc, and produces a structured report. Invoke via
  `invoke_sub_agent(name: "frontend-package-auditor", prompt: "Audit @stackra/<pkg>")`.
- **As a package author** — walk the checklist before opening a PR. Every fail
  is a rework loop; every pass ships faster.

The audit is READ-ONLY. Auditor reports never edit source; fixes go through a
follow-up commit by the package author (or a WRITER agent).

## Section 1 — Package identity & metadata

Owner: `catalog-manifest.md` + `package-naming.md`.

- [ ] **1.1** — `package.json.name` matches the workspace naming convention
      (`@stackra/<slug>`, kebab-case slug). → `package-naming.md`
- [ ] **1.2** — `catalog.json` exists at the package root. →
      `catalog-manifest.md`
- [ ] **1.3** — `catalog.json` starts with `$schema` pointing at
      `catalog.v1.json`. → `catalog-manifest.md`
- [ ] **1.4** — `catalog.name` matches `package.json.name`. →
      `catalog-manifest.md`
- [ ] **1.5** — `catalog.tier` is one of `foundation`, `framework`, `saas`,
      `domain`. → `catalog-manifest.md`
- [ ] **1.6** — `catalog.kind` is one of `framework-plumbing`, `feature`, `sdk`,
      `tooling`, `template`, `starter`. → `catalog-manifest.md`
- [ ] **1.7** — `catalog.surfaces` matches `package.json.exports` (each exports
      key translates to a surface value). → `catalog-manifest.md`
- [ ] **1.8** — `catalog.peer_deps` matches `package.json.peerDependencies`
      keys. → `catalog-manifest.md`
- [ ] **1.9** — `catalog.owning_agent` is the slug of a real agent under
      `.kiro/agents/`. → `catalog-manifest.md`
- [ ] **1.10** — `catalog.maturity` is truthful (no `"stable"` on unreleased
      packages). → `catalog-manifest.md`
- [ ] **1.10a** — `catalog.maturity != "alpha"` when
      `package.json.version >= 1.0.0`. `alpha` on a v1+ package is untruthful
      (semver 1.x commits the public API; alpha signals no such commitment).
      Bump to `beta` per
      [ADR-0053](../../docs/adr/0053-version-maturity-reconcile.md). →
      `catalog-manifest.md`
- [ ] **1.10b** — `catalog.maturity: "stable"` requires a promotion ADR under
      `docs/adr/` naming the ADR-0053 §Follow-up criteria the package cleared.
      Missing ADR = P2 finding. → `catalog-manifest.md`
- [ ] **1.11** — `catalog.docs` lists at least the package's `README.md`. →
      `catalog-manifest.md`

## Section 2 — Subpath layering

Owner: `subpath-layering.md`.

- [ ] **2.1** — `core/` imports nothing from `@/react/`, `@/native/`,
      `@/testing/`, `@/vite/`, `@/console/`, or any relative equivalent. →
      `subpath-layering.md` §Rule 1
- [ ] **2.2** — `react/` imports nothing from `@/native/` (or relative
      equivalent). → `subpath-layering.md` §Rule 1
- [ ] **2.3** — `native/` imports nothing from `@/react/` (or relative
      equivalent). → `subpath-layering.md` §Rule 1
- [ ] **2.4** — `testing/`, `vite/`, `console/` import from `core/` only, never
      from platform subpaths. → `subpath-layering.md` §Rule 1
- [ ] **2.5** — Every platform module composes core via
      `imports: [XModule.forRoot(options)]`. → `subpath-layering.md` §Shape 1
- [ ] **2.6** — No pass-through platform module (a module that only forwards to
      core). → `subpath-layering.md` §forbidden
- [ ] **2.7** — Every platform module class is `Web<Name>Module` (web) /
      `Native<Name>Module` (native). → `subpath-layering.md` §Shape 1
- [ ] **2.8** — For sub-domain packages (routing), `core/` composes sub-domain
      modules; sub-domains never import platform subpaths. →
      `subpath-layering.md` §sub-domain

## Section 3 — Public API discipline

Owner: `code-standards.md` + `contract-reexports.md` +
`browser-safe-imports.md`.

- [ ] **3.1** — Every subpath's `index.ts` exports only public symbols (no
      internal helpers, no test doubles). → `code-standards.md`
- [ ] **3.2** — Every folder has an `index.ts` barrel. → `code-standards.md`
- [ ] **3.3** — Every file exports exactly one symbol (with the family- grouping
      exception for React entities). → `code-standards.md`
- [ ] **3.4** — No `default` exports (except grandfathered `tsup.config.ts` /
      `vitest.config.ts` at package root). → `code-standards.md`
- [ ] **3.5** — File suffix matches the export kind (`.service.ts` for a service
      class, `.interface.ts` for an interface, etc.). → `code-standards.md`
- [ ] **3.6** — Folder name matches the export category (a `.service.ts` lives
      under `services/`, an `.interface.ts` under `interfaces/`). →
      `code-standards.md`
- [ ] **3.7** — No re-export from `@stackra/contracts` in a feature package's
      public API. → `contract-reexports.md`
- [ ] **3.8** — No local `I<Name>Like` structural shim; missing contract
      interfaces get promoted to `@stackra/contracts`. → `contract-reexports.md`
- [ ] **3.9** — No re-export of peer symbols (`@heroui/react`, `react`,
      `@tanstack/*`, ...) unless the package IS that peer's workspace surface. →
      `contract-reexports.md`
- [ ] **3.10** — In the browser-reachable surface (`.` + `./react`), zero
      named/default imports from `node:*` modules — namespace imports +
      try/catch guards only. → `browser-safe-imports.md`

## Section 4 — Feature contributions

Owner: `subpath-layering.md` + `module-lifecycle.md`.

- [ ] **4.1** — Routes register from `react/` via `WebXModule`, not from
      `core/`. → `subpath-layering.md` §Rule 4
- [ ] **4.2** — Named HTTP connections register from `core/` (they're
      platform-agnostic). → `subpath-layering.md` §Rule 4
- [ ] **4.3** — Every `forFeature` call uses an inline
      `@Injectable() class     XRegistrar implements OnApplicationBootstrap` per
      ADR-0052 §Canonical shape — never a side-effecting `useFactory`
      (sentinel-returning OR lifecycle-hook-object-returning). →
      `module-lifecycle.md`
- [ ] **4.4** — Every discovery loader implements `OnApplicationBootstrap`, not
      `OnModuleInit`. → `discovery-vs-loader.md`
- [ ] **4.5** — Every loader class is named `<Name>Loader`, not
      `<Name>Discovery`. → `discovery-vs-loader.md`

## Section 5 — Localization

Owner: `frontend-localization.md`.

- [ ] **5.1** — Package that renders user-facing strings ships
      `src/core/i18n/en.json` + `src/core/i18n/ar.json` (or `src/i18n/` for
      single-entry packages). → `frontend-localization.md`
- [ ] **5.2** — No literal English text nodes in JSX (`>Some Text<`) — every hit
      is a `t(...)` call or carries a `// i18n-exempt: <reason>` inline comment.
      → `frontend-localization.md`
- [ ] **5.3** — No literal `aria-label`, `placeholder`, `title`, `alt` values —
      same rule. → `frontend-localization.md`
- [ ] **5.4** — `en.json` and `ar.json` have 1:1 key parity (checked by
      `<pkg>/__tests__/i18n-parity.test.ts` when present). →
      `frontend-localization.md`
- [ ] **5.5** — Catalog uses `snake_case` keys, no outer namespace prefix,
      nested by feature area. → `frontend-localization.md`
- [ ] **5.6** — Framework-plumbing packages ship catalogs ONLY for user- facing
      strings (offline banner, error fallback, install prompt). →
      `frontend-localization.md`

## Section 6 — Dependencies

Owner: `package-conventions.md` + `subpath-layering.md`.

- [ ] **6.1** — Every peer dep in `package.json.peerDependencies` is mirrored in
      `devDependencies`. → `package-conventions.md`
- [ ] **6.2** — Internal `@stackra/*` peers use `workspace:^`. →
      `package-conventions.md`
- [ ] **6.3** — Internal `@stackra/*` devDeps use `workspace:*`. →
      `package-conventions.md`
- [ ] **6.4** — Third-party peers use `catalog:` (pinned in
      `package.json workspaces`). → `package-conventions.md`
- [ ] **6.5** — `react`, `react-dom`, `@stackra/ui`, `@stackra/routing`,
      `@stackra/testing` are OPTIONAL peers when only a specific subpath needs
      them. → `subpath-layering.md` §peer-dep
- [ ] **6.6** — RN peers (`react-native`, `@react-native-community/*`) are
      optional when only `native/` needs them. → `subpath-layering.md` §peer-dep
- [ ] **6.7** — No `dependencies` block (every `@stackra/*` runtime consumer is
      a peer). → `package-conventions.md`
- [ ] **6.8** — No bare version pins on third-party deps — use `catalog:` OR
      flag the catalog gap. → `package-conventions.md`
- [ ] **6.9** — `peerDependenciesMeta.<dep>.optional: true` matches the dep's
      subpath consumption. → `subpath-layering.md` §peer-dep

## Section 7 — Tooling & standards

Owner: `package-conventions.md`.

- [ ] **7.1** — `tsup.config.ts` uses `defineBaseConfig` from
      `@stackra/tsup-config` with one entry per subpath. →
      `package-conventions.md`
- [ ] **7.2** — `vitest.config.ts` merges `@stackra/testing/preset`. →
      `package-conventions.md`
- [ ] **7.3** — `vitest.config.ts` sets `oxc: false, esbuild: false` when the
      package uses `@stackra/container` / `@stackra/decorators/*` decorator
      metadata. → `package-conventions.md`
- [ ] **7.4** — `tsconfig.json` extends `@stackra/typescript-config/base` +
      declares `"paths": { "@/*": ["./src/*"] }`. → `package-conventions.md`
- [ ] **7.5** — `package.json` has `"sideEffects": false`. →
      `package-conventions.md`
- [ ] **7.6** — `package.json.exports` map has one triple
      (`{ types, import, require }`) per subpath. → `package-conventions.md`
- [ ] **7.7** — `package.json.scripts` has the canonical set (`build`, `dev`,
      `clean`, `typecheck`, `test`, `test:watch`, `test:coverage`). →
      `package-conventions.md`
- [ ] **7.8** — `.turbo` and `dist` are gitignored. → `package-conventions.md`

## Section 8 — Documentation

Owner: `documentation.md`.

- [ ] **8.1** — Every source file (`.ts` / `.tsx`) starts with a top-of-file
      docblock — `@file`, `@module`, `@description`. → `documentation.md`
- [ ] **8.2** — Every exported symbol has a JSDoc block. → `documentation.md`
- [ ] **8.3** — Every method / function has `@param` per parameter, `@returns`
      when non-void, `@throws` per throwing path. → `documentation.md`
- [ ] **8.4** — Every interface / type has per-property JSDoc where the meaning
      isn't obvious. → `documentation.md`
- [ ] **8.5** — Non-obvious flow, fail-soft paths, ordering constraints, and
      external-behaviour ties carry inline comments. → `documentation.md`
- [ ] **8.6** — Barrels contain ONLY `export { ... } from '...'` /
      `export type { ... } from '...'` lines — no declarations, no side effects.
      → `code-standards.md`
- [ ] **8.7** — Package `README.md` exists at the package root with purpose,
      install, usage, and cross-references. → `frontend-packages.md`

## Section 9 — Testing surface

Owner: `package-conventions.md` + `testing.md`.

- [ ] **9.1** — Package ships a `./testing` entry if it has state or DI that
      consumers need to mock. → `package-conventions.md`
- [ ] **9.2** — `testing/` provides an in-memory or fake service class + a
      `Test<Name>Provider` for React consumers. → `frontend-packages.md`
- [ ] **9.3** — `__tests__/` directory with `Unit/` + optional integration
      tests. → `testing.md`
- [ ] **9.4** — Tests use `vitest run --passWithNoTests` shape from
      `package.json.scripts.test`. → `package-conventions.md`
- [ ] **9.5** — Every controller-equivalent endpoint / service method / hook has
      at least one happy-path test. → `testing.md`

## Section 10 — Promotion candidates

Owner: `contracts-and-decorators-promotion.md`.

- [ ] **10.1** — DI tokens used by 2+ packages live in `@stackra/contracts`, not
      in the feature package. → `contracts-and-decorators-promotion.md`
- [ ] **10.2** — Cross-package interfaces (`INetworkStatus`, `IStorage`,
      `IAiClient`) live in `@stackra/contracts`. →
      `contracts-and-decorators-promotion.md`
- [ ] **10.3** — Decorators used by 2+ packages live in
      `@stackra/decorators/<consumer>/`. →
      `contracts-and-decorators-promotion.md` **EXCEPTION** — the DI framework
      primitives (`Module`, `Injectable`, `Inject`, `Optional`, `Global`) stay
      in `@stackra/container` per
      [ADR-0059](../../docs/adr/0059-container-decorator-quintet-exception.md).
      Consumers importing these five from `@stackra/container` are NOT §10.3
      findings.
- [ ] **10.4** — No concrete class in `@stackra/contracts` — only interfaces,
      types, tokens, enums, framework primitives. →
      `contracts-and-decorators-promotion.md`
- [ ] **10.5** — `@stackra/decorators` sub-domains match consumer package slugs
      (no `common/` / `shared/` catch-all). →
      `contracts-and-decorators-promotion.md`

## Section 11 — Communication + module lifecycle

Owner: `communication-patterns.md` + `module-lifecycle.md`.

- [ ] **11.1** — No `class *Bootstrap` — every seed / population runs through a
      lifecycle hook (`OnModuleInit` / `OnApplicationBootstrap`). →
      `module-lifecycle.md`
- [ ] **11.2** — No `useFactory` that ends with `return null` / `return true`
      after a side effect. → `module-lifecycle.md`
- [ ] **11.3** — Every emit uses a constant from a `*.events.ts` file (no raw
      event-name strings at call sites). → `events-authoring.md`
- [ ] **11.4** — Every `@OnEvent(...)` and `useOnEvent(...)` uses a constant. →
      `events-authoring.md`
- [ ] **11.5** — Every service in the DI graph reads tree-scoped values via
      method args, never `React.useContext(...)` inside an `@Injectable()`
      class. → `communication-patterns.md`

## Section 12 — Storage + support helpers

Owner: `storage-usage.md` + `support-utilities.md`.

- [ ] **12.1** — Every persistence read/write routes through `@stackra/storage`
      (`useStorage()` or `IStorageManager`). No direct `localStorage.*` /
      `sessionStorage.*` / `AsyncStorage.*` / `document.cookie`. →
      `storage-usage.md`
- [ ] **12.2** — Direct-storage exemptions carry an inline comment naming the
      sync-semantics constraint (CAS primitive). → `storage-usage.md`
- [ ] **12.3** — String / array / number / URL / env / timing helpers go through
      `@stackra/support` (`Str`, `Arr`, `collect`, `Num`, `Uri`, `Env`, `sleep`,
      `retry`, `once`, `tap`, `timebox`). → `support-utilities.md`
- [ ] **12.4** — No direct `process.env.*` / `import.meta.env.*` reads — always
      through `Env.*`. → `support-utilities.md`

## Section 13 — React subpath specifics

Owner: `ui-components.md`.

- [ ] **13.1** — Every visual component composes primitives from
      `@stackra/ui/react`, never from `@heroui/react` directly. →
      `ui-components.md`
- [ ] **13.2** — No bespoke CSS class-name literals on custom markup — only
      Tailwind layout utilities + HeroUI components. → `ui-components.md`
- [ ] **13.3** — Single-choice dropdowns use HeroUI `ComboBox` unless a comment
      justifies `Select`. → `ui-components.md`
- [ ] **13.4** — Every component's compound API (part names, prop names,
      controlled-value contract) verified against the HeroUI MCP
      `get_component_docs`. → `ui-components.md`
- [ ] **13.5** — Title Case on headings; no ALL-CAPS `uppercase` utility on
      `<h1..h6>`, nav-rail labels, or micro-headers (except the `@stackra/kbd`
      command-palette exemption). → `ui-components.md`
- [ ] **13.6** — Icons imported as components from `@stackra/ui/icons` (typed
      `IconType`), never rendered elements. → `frontend-packages.md`

## Section 14 — Shell + tmp discipline

Owner: `shell-commands.md` + `tmp-files.md`.

- [ ] **14.1** — Any package-shipped shell script under `scripts/` avoids
      one-liner `for` / `while` loops in tool-invoked commands. →
      `shell-commands.md`
- [ ] **14.2** — Any agent-authored temp file lands under `.tmp/`, not `/tmp/`.
      → `tmp-files.md`

## Reporting shape

The auditor emits a structured markdown report:

```
# Frontend package audit — @stackra/<pkg>
Date: <YYYY-MM-DD>
Auditor: frontend-package-auditor

## Summary
- Compliant: X of 88 checks
- Violations: Y (P0: n, P1: n, P2: n)
- Warnings: Z
- Sections skipped: <list> (with reason)

## Violations by section

### Section 2 — Subpath layering

#### 2.1 VIO — core/rbac.module.ts:38 — core imports @/react
Detail: `import { buildRbacRoutes } from "@/react/routes/build-rbac-routes.util"`
Fix: move RoutingModule.forFeature(...) into a WebRbacModule under react/.
Steering: subpath-layering.md §Rule 1
Priority: P0 (blocks tree-shaking + peer-dep contract)

... (repeat per violation)

## Passing checks
Section 1: 11/11
Section 2: 6/8 (2.1, 2.6 failing)
...
```

Priorities:

- **P0** — blocks a critical property (tree-shaking, peer-dep contract,
  browser-safe imports, tenant isolation).
- **P1** — breaks a stated invariant but has no immediate user-visible impact
  (missing docblocks, missing catalog entry, wrong dep classifier).
- **P2** — style / consistency drift (naming, folder placement below the
  threshold).

## Sections a section may skip

Some sections don't apply to some packages. The auditor MAY skip a section only
when the target package meets the exclusion criterion:

- **Section 5 (localization)** — skip when the package renders no user- facing
  strings (`cache`, `container`, `pipeline`, `queue`, ...). Note the skip in the
  report.
- **Section 13 (react subpath)** — skip when the package has no `react/`
  subpath.
- **Section 4 §4.4-4.5 (discovery loaders)** — skip when the package ships no
  `discovery-*.service.ts` or `*-loader.service.ts`.

The auditor states EVERY skip explicitly + names the exclusion criterion. Never
a silent skip.

## Automation gates (planned)

CI runs `frontend-package-auditor` on every package on every PR that touches
`frontend/packages/**`. Reports land under
`.kiro/reports/audit-<pkg>-<date>.md`. Fails on P0 violations; warns on P1 / P2.

Manual invocation:

```
invoke_sub_agent(name: "frontend-package-auditor", prompt: "Audit @stackra/<pkg>")
```

Or for the whole workspace:

```
invoke_sub_agent(name: "frontend-package-auditor", prompt: "Audit every @stackra/* frontend package under frontend/packages/")
```

## Cross-references

- `subpath-layering.md` — subpath layering rules.
- `code-standards.md` — folder taxonomy + naming.
- `package-conventions.md` — module + config trio + tooling standards.
- `catalog-manifest.md` — `catalog.json` shape.
- `frontend-localization.md` — per-package i18n.
- `contract-reexports.md` — re-export rules.
- `browser-safe-imports.md` — Node-safe browser bundles.
- `contracts-and-decorators-promotion.md` — promotion thresholds.
- `documentation.md` — docblock rules.
- `ui-components.md` — React subpath rules.
- `module-lifecycle.md` — lifecycle hooks.
- `events-authoring.md` — event catalogues.
- `communication-patterns.md` — DI / context / events lanes.
- `discovery-vs-loader.md` — auto-registration.
- `storage-usage.md` — `@stackra/storage`.
- `support-utilities.md` — `@stackra/support`.
- `testing.md` — test framework.
- `shell-commands.md` — shell command guardrails.
- `tmp-files.md` — temp file guardrails.
- `frontend-packages.md` — frontend-package architecture doctrine.
