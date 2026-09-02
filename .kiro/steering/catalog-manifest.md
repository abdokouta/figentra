# Catalog manifest (`catalog.json`)

Rules for the per-package metadata sibling every workspace package ships as
`catalog.json` next to its `package.json`. Consumed by the workspace CLI
(`stackra catalog:list`, `stackra catalog:search`) and the `stackra new`
capability multiselect.

Canonical schema:
[`.ref/schemas/catalog.v1.json`](../../.ref/schemas/catalog.v1.json).

Read alongside:

- `package-naming.md` — the naming rules `catalog.name` must mirror.
- `package-conventions.md` — the package scaffold rules (exports, peers).
- `subpath-layering.md` — the subpath rules `catalog.surfaces` reflects.
- `frontend-package-audit-checklist.md` — walks manifest checks per package.

## Rule — every package ships a `catalog.json`

Every workspace package — backend (`backend/packages/*/`) and frontend
(`frontend/packages/*/`) — ships a `catalog.json` at its root, next to
`package.json`. Missing = the package is invisible to the CLI, catalog search,
and the `stackra new` capability picker.

Location:

```
frontend/packages/<name>/catalog.json    ← frontend
backend/packages/<name>/catalog.json     ← backend
```

## Rule — the shape is fixed by the JSON schema

The canonical schema is
[`.ref/schemas/catalog.v1.json`](../../.ref/schemas/catalog.v1.json). Every
`catalog.json` starts with a `$schema` field pointing at the schema so editors
get autocomplete + on-save validation.

> **ADR anchor.** The `$schema` value is a REPO-RELATIVE path to
> `.ref/schemas/catalog.v1.json`, not an external URL. Codified by
> [ADR-0050](../../docs/adr/0050-catalog-schema-hosting.md). Frontend catalogs
> at `frontend/packages/<pkg>/catalog.json` declare
> `"$schema": "../../.ref/schemas/catalog.v1.json"`; backend catalogs at
> `backend/packages/<layer>/<pkg>/catalog.json` declare
> `"$schema": "../../../.ref/schemas/catalog.v1.json"` (one extra `../` for the
> deeper path). External URLs (http:// or https://) are a supply-chain risk and
> are rejected by the auditor.

### Required fields (schema minimum)

- `name` — full package identifier (`@stackra/network`, `@stackra/rbac`). MUST
  match `package.json.name`.
- `tier` — one of `foundation`, `framework`, `saas`, `domain`.

### Required fields (workspace convention on top of the schema)

Every FE package MUST also populate:

| Field             | Type           | Rule                                                                                                                                                                                                                   |
| ----------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`         | uri            | Repo-relative path to `.ref/schemas/catalog.v1.json` (frontend: `../../.ref/schemas/catalog.v1.json`; backend: `../../../.ref/schemas/catalog.v1.json`). Never an http/https URL. See ADR-0050.                        |
| `surfaces`        | string[]       | Every publishable subpath the package exports. Must match `package.json.exports` (translated from `.` → `core`, `./react` → `react`, etc.).                                                                            |
| `kind`            | enum           | `framework-plumbing` for infrastructure packages, `feature` for user-facing features, `sdk` for wire-contract mirrors, `tooling` for build/dev tooling, `template` for scaffolding starters, `starter` for app-shells. |
| `purpose`         | string (≤ 200) | One sentence, ends with a period. Shown by `stackra catalog:list`.                                                                                                                                                     |
| `capabilities`    | string[]       | Bulleted list of one-line capabilities (≤ 100 chars each). Case-insensitive substring match drives the `stackra new` picker.                                                                                           |
| `when_to_use`     | string         | One-line guidance on when to reach for this package.                                                                                                                                                                   |
| `when_not_to_use` | string         | One-line guidance on when to reach for a sibling package instead. Names the sibling.                                                                                                                                   |
| `peer_deps`       | string[]       | Every companion package a consumer must also install. Must match `package.json.peerDependencies` keys.                                                                                                                |
| `backend_pair`    | string \| null | Frontend: the matching backend package that owns the wire contract, or `null` for standalone. Backend: always `null`.                                                                                                  |
| `size_gzip_kb`    | object         | Per-surface size budget in gzipped KB. Populated by the size-reporting pipeline; author with `{}` and let CI fill in.                                                                                                  |
| `maturity`        | enum           | `planned` (spec only, no code), `alpha`, `beta`, `stable`, `deprecated`. Default `alpha`.                                                                                                                              |
| `owning_agent`    | string         | Slug of the sub-agent that maintains this package (see `.kiro/agents/README.md`). E.g. `framework-core-builder`, `heroui-ui-builder`.                                                                                  |
| `docs`            | string[]       | Repo-relative paths to primary documentation. At minimum the package's `README.md`.                                                                                                                                    |

### Canonical example (frontend)

```json
{
  "$schema": "https://gist.githubusercontent.com/academorix-user/073a1ab687cd93ede7ae927b96a025ea/raw/77b3c5a236cbdbcfc74f221f204c4b1b83bb509d/catalog.v1.json",
  "name": "@stackra/network",
  "tier": "framework",
  "surfaces": ["core", "react", "native", "testing"],
  "kind": "framework-plumbing",
  "purpose": "Cross-platform network detection with typed events and React bindings.",
  "capabilities": [
    "Online/offline detection across web, native, and Node",
    "Connection type and effective bandwidth via Network Information API",
    "Typed events: network.online, network.offline, network.changed",
    "React hook: useNetworkStatus",
    "React Native detector via @react-native-community/netinfo"
  ],
  "when_to_use": "Reacting to online/offline transitions or gating requests on connection quality.",
  "when_not_to_use": "For pause/resume of queued requests use @stackra/query with network hints; for offline sync use @stackra/sync.",
  "peer_deps": [
    "@react-native-community/netinfo",
    "@stackra/config",
    "@stackra/container",
    "@stackra/contracts",
    "@stackra/logger",
    "@stackra/support",
    "@stackra/testing",
    "@stackra/ui",
    "react",
    "react-native",
    "reflect-metadata"
  ],
  "backend_pair": null,
  "size_gzip_kb": {},
  "maturity": "alpha",
  "owning_agent": "framework-core-builder",
  "docs": ["frontend/packages/network/README.md"]
}
```

## Rule — `surfaces` must match `package.json.exports`

`catalog.surfaces` is the source of truth for which subpaths the package
publishes. It MUST agree with the package's build manifest:

- Every entry in `package.json.exports` (except `.` which maps to `core`)
  translates to a `surfaces[]` entry: `./react` → `"react"`, `./native` →
  `"native"`, `./testing` → `"testing"`, `./vite` → `"vite"`, `./console` →
  `"console"`, `./server` → `"server"`.
- Every entry in `tsup.config.ts` also translates.

If a package adds a subpath in `package.json.exports`, it MUST also add it to
`catalog.surfaces` in the same commit. Reviewers reject the PR otherwise.

Valid surface values per the schema: `core`, `react`, `native`, `testing`,
`console`, `vite`, `server`.

> **ADR anchor.** Sub-domain subpaths — bounded contexts inside a package,
> distinct from platform surfaces — go under the schema's `sub_domains` field,
> codified by
> [ADR-0049](../../docs/adr/0049-catalog-schema-sub-domains-field.md). A
> `catalog.json` with sub-domain subpaths declares them alongside `surfaces`,
> e.g. routing:
>
> ```jsonc
> {
>   "surfaces": ["core", "react", "testing", "vite", "console"],
>   "sub_domains": ["middleware", "guards", "seo", "analytics", "matchers"],
> }
> ```
>
> The `surfaces` array stays scoped to the closed platform-axis enum;
> `sub_domains` is free-form and each value matches a `package.json.exports` key
> with the leading `./` stripped. The reconciliation now reads
> `Object.keys(package.json.exports).length - 1` against
> `surfaces.length + sub_domains.length` (see the enforcement section below).

## Rule — `peer_deps` must match `package.json.peerDependencies`

Every key in `package.json.peerDependencies` MUST appear in `catalog.peer_deps`.
Missing = a consumer running `stackra new` sees an incorrect list; extra = the
catalog claims a peer the package doesn't consume.

Add-a-peer PRs update both files in the same commit.

## Rule — `owning_agent` must exist in `.kiro/agents/`

`catalog.owning_agent` names the sub-agent responsible for the package. The slug
must match a real agent charter in `.kiro/agents/*.md`. Common frontend owning
agents:

- `framework-core-builder` — non-UI framework packages (`container`, `http`,
  `queue`, `cache`, `network`, `logger`, ...).
- `heroui-ui-builder` — packages that ship HeroUI-based React components (`ui`,
  `auth-ui`, `dashboard`, `sdui`, ...).
- `heroui-native-builder` — packages that ship React Native components.
- `worker-service-builder` — backend Cloudflare Worker / service packages.
- `python-service-builder` — the AI service and future Python services.

Adding a new sub-agent means a new PR that updates the agent roster;
`catalog.owning_agent` values can only reference agents that exist.

## Rule — the manifest is truthful, not aspirational

> **ADR anchor.** The relationship between `package.json.version` and
> `catalog.maturity` is codified by
> [ADR-0053](../../docs/adr/0053-version-maturity-reconcile.md). A package whose
> `version >= 1.0.0` MUST NOT declare `maturity: "alpha"` — the two signals
> contradict each other (semver 1.x commits the public API; alpha signals no
> such commitment). Promotion to `maturity: "stable"` requires its own ADR under
> `docs/adr/` naming the criteria the package met — the release manager doesn't
> hand-promote packages without one.

- `maturity: "stable"` — production-shipping, semver-stable public API, tests +
  docs + changesets in place. Requires a promotion ADR under `docs/adr/` per
  ADR-0053 §Follow-up.
- `maturity: "beta"` — public API committed at each major boundary; breaking
  changes still possible via a major bump. The default for every package that
  has cleared `1.0.0` but not yet earned `stable`.
- `maturity: "alpha"` — anything can change without notice. The correct signal
  for `0.x.y` packages.
- `maturity: "planned"` — the package doesn't exist yet. Reserved for spec-only
  entries under `.kiro/plans/`. Do NOT ship a `planned` package with actual
  code.
- `maturity: "deprecated"` — scheduled for removal; every consumer must migrate.

Reviewers reject `maturity: "stable"` claims on packages that don't have a
public API contract, a full test suite, a changeset history, AND a promotion ADR
that names the ADR-0053 §Follow-up criteria the package cleared.

## Enforcement

Zero-hit greps:

- **Every FE package under `frontend/packages/*/` has a `catalog.json`.**
  Missing = flagged.
- **Every `catalog.json` starts with `$schema`.** Missing = flagged. The value
  MUST match `^\.\.(/\.\.)*/\.ref/schemas/catalog\.v1\.json$` per
  [ADR-0050](../../docs/adr/0050-catalog-schema-hosting.md) — any http/https URL
  is flagged.
- **`catalog.name` matches `package.json.name`** per package. Mismatch =
  flagged.
- **`catalog.surfaces.length + catalog.sub_domains.length` equals**
  `Object.keys(package.json.exports).length - 1` (`.` → `core`). Off-by-one =
  flagged. See
  [ADR-0049](../../docs/adr/0049-catalog-schema-sub-domains-field.md) for the
  two-array reconciliation contract.
- **Every `catalog.peer_deps` entry** appears as a key in
  `package.json.peerDependencies`. Missing / extra = flagged.
- **`catalog.owning_agent` slug** exists in `.kiro/agents/`. Missing = flagged.
- **`maturity: "alpha"` on a package with `version >= 1.0.0`** is a P2 finding
  per [ADR-0053](../../docs/adr/0053-version-maturity-reconcile.md). Bump to
  `beta` (or ship the promotion ADR that lands `stable`).
- **`maturity: "stable"` without a promotion ADR** under `docs/adr/` naming the
  ADR-0053 §Follow-up criteria the package cleared is a P2 finding per ADR-0053.

Full audit runs via the `frontend-package-auditor` sub-agent (see
`frontend-package-audit-checklist.md`).

## Anti-patterns

| Anti-pattern                                                                  | Fix                                                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No `catalog.json` at package root                                             | Author one from the canonical example above.                                     |
| `catalog.surfaces` includes `react` but `package.json` has no `./react` entry | Fix the mismatch — either add the exports entry or drop from surfaces.           |
| `catalog.peer_deps` lists a package not in `peerDependencies`                 | Add the peer OR drop from catalog.                                               |
| `catalog.owning_agent: "team-frontend"`                                       | Use an actual sub-agent slug from `.kiro/agents/`.                               |
| `maturity: "stable"` on an unreleased package                                 | Downgrade to `alpha` or `beta` until the public API contract locks.              |
| `maturity: "alpha"` on a `version >= 1.0.0` package                           | Bump to `beta` per ADR-0053; `alpha` is only correct for `0.x.y`.                |
| `maturity: "stable"` without a promotion ADR under `docs/adr/`                | Author the promotion ADR naming ADR-0053 §Follow-up criteria first.              |
| `docs: []`                                                                    | At minimum list the package's `README.md`.                                       |
| `when_not_to_use` is empty                                                    | Name the sibling package that solves the adjacent use case.                      |
| `capabilities` written as marketing bullets                                   | Concrete technical capabilities — what a consumer's code actually does.          |
| `kind: "framework"` (not a schema enum)                                       | Use `framework-plumbing`, `feature`, `sdk`, `tooling`, `template`, or `starter`. |

## Cross-references

- Schema: [`.ref/schemas/catalog.v1.json`](../../.ref/schemas/catalog.v1.json) —
  authoritative field list + enums.
- `package-naming.md` — naming rules `catalog.name` must mirror.
- `package-conventions.md` — package scaffold rules (exports, peers, scripts).
- `subpath-layering.md` — subpath rules `catalog.surfaces` reflects.
- `frontend-package-audit-checklist.md` — walks manifest checks per package.
