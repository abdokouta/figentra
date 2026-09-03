# Package naming — the workspace convention

The workspace hosts multiple brands under one Git repo:

- **Stackra** — the independent framework. Frontend (Vite + React + TypeScript),
  native (React Native + Uniwind), config presets, CLI. Every framework-tier
  package under `packages/**` ships as `@stackra/*` (npm).
- **Academorix** — Figentra's sports-academy product built on Stackra. Every
  product-tier package (workspace package OR frontend app) ships as
  `@academorix/*`.
- **Figentra** — the corporation. Legal entity; owns copyright + `author`
  fields. **Never** appears in a package identifier for this role per
  [brand-hierarchy.md](brand-hierarchy.md).

Full brand semantics live in [brand-hierarchy.md](brand-hierarchy.md); this doc
codifies the mechanical npm NAMING rules.

## Rule 1 — Vendor scope is the boundary

> **ADR anchor.** The three-scope model is codified by
> [ADR-0069](../../docs/adr/0069-corporate-operator-vendor-scope.md), which
> introduced the `@figentra/*` corporate-operator scope by superseding
> [ADR-0058](../../docs/adr/0058-per-application-service-vendor-split.md)
> §Alternatives §C.

Three npm scopes, three ownership layers:

| npm scope       | Layer     | Owning brand                      | Home                                                                         |
| --------------- | --------- | --------------------------------- | ---------------------------------------------------------------------------- |
| `@stackra/*`    | Framework | Stackra (portable code)           | `packages/**`, `packages/config/**`, `templates/{vite,react-native}/`        |
| `@figentra/*`   | Operator  | Figentra (corporate SaaS runtime) | `services/{identity,commerce,notifications,observability,platform}-service/` |
| `@academorix/*` | Product   | Academorix                        | `services/{api,ai}/`, `apps/academorix-*/`                                   |

**FORBIDDEN scopes** — every one fails audit:

- **`@figentra/*` outside SHARED runtime services** — `@figentra/rbac`,
  `@figentra/http`, `@figentra/coach-dashboard` are ALL forbidden. `@figentra/*`
  is exclusively for the five SHARED runtime services under
  `services/{identity,commerce,notifications,observability,platform}-service/`.
  Framework primitives → `@stackra/*`. Product code → `@<product>/*`. See
  [brand-hierarchy.md §Figentra layer](brand-hierarchy.md).
- Any scope that mixes concerns (`@stackra-and-academorix/*`,
  `@figentra-stackra/*`) — vendor scope is the brand boundary.

## Rule 2 — No framework prefix in the package slug

Reject prefixes like `ts-*`, `js-*`, `react-*`, `node-*` inside the package
name. The `@scope/` IS the discriminator; the ecosystem is always npm. Adding a
runtime prefix on top is redundant. Precedent: `@nestjs/common` (not
`@nestjs/ts-common`), `@remix-run/router` (not `@remix-run/js-router`).

**Exception**: when a package is a THIRD-PARTY adapter (wraps a third-party lib
for use inside Stackra), the third-party's OWN name survives inside the package
slug — because that's the discovery handle developers already know.
`@stackra/sentry` (adapter around `@sentry/*`), `@stackra/posthog` (adapter
around `posthog-js`). We keep the third-party's own name so the mapping is
legible.

## Rule 3 — `<category>-<slug>` for grouped packages

An npm package name allows exactly ONE slug after the scope. Domain grouping
lives in the PACKAGE slug (as a category prefix), never as a second scope:

- ✓ `@stackra/observability-activity`
- ✓ `@stackra/finance-gateway`
- ✓ `@stackra/growth-analytics`
- ✓ `@stackra/geofencing` (single package, no category needed)
- ✓ `@stackra/rbac` (single package, no category)
- ✗ `@stackra/activity-observability` (reversed order — read category-first:
  "observability-activity" = the activity module WITHIN observability)

### When to prefix a category

Include a `<category>-` prefix in the slug when the package belongs to a bounded
context that ships 2+ related packages under the same scope. Skip the prefix for
standalone concerns.

| Bucket                                               | Pattern                    | Example                                                       |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Single-package framework concern                     | `@stackra/<slug>`          | `@stackra/rbac`, `@stackra/geofencing`, `@stackra/support`    |
| Multi-package framework domain (2+ related packages) | `@stackra/<domain>-<slug>` | `@stackra/observability-activity`, `@stackra/finance-gateway` |
| SHARED runtime service (Figentra operator)           | `@figentra/<slug>-service` | `@figentra/identity-service`, `@figentra/commerce-service`    |
| Per-Application service (product-owned)              | `@<product>/<slug>`        | `@academorix/api`, `@academorix/ai`                           |
| Framework third-party adapter                        | `@stackra/<vendor-slug>`   | `@stackra/sentry`, `@stackra/posthog`                         |
| Product-tier package (Academorix)                    | `@academorix/<slug>`       | `@academorix/athlete`, `@academorix/lead`                     |

**Category slugs read left-to-right**: `@stackra/finance-gateway` = "the gateway
module inside stackra finance." Alphabetical listing groups every category's
packages together in a `pnpm list` sweep.

**Naming precedence when the "category" could go either way**: pick the category
that names the BOUNDED CONTEXT the package belongs to — the answer to "if I
moved this package to a new codebase, which sibling packages would travel with
it?" Finance packages travel together; observability packages travel together;
an rbac package doesn't have obvious siblings so it stays `@stackra/rbac`
without a category.

## Rule 4 — Package slug is kebab-case

- ✓ `@stackra/caching`, `@stackra/service-provider`, `@stackra/finance-gateway`,
  `@academorix/athlete-guardian`
- ✗ `@stackra/Caching`, `@stackra/serviceProvider`, `@stackra/service_provider`

Matches npm ecosystem defaults. Applies to BOTH the category prefix AND the
sub-slug: `@stackra/finance-gateway` (both kebab), not
`@stackra/finance-Gateway`.

## Rule 5 — Physical folder path does NOT dictate the package name

The `name` in `package.json` is the shipped identifier. The folder path is for
human navigation. They RESEMBLE each other but do not have to match
character-for-character.

- Folder: `packages/observability/activity/`
- Package name: `@stackra/observability-activity`

Folder org uses lowercase-hyphenated nested paths. The package name flattens
that path into `<scope>/<category>-<slug>`. The mapping stays legible
left-to-right.

When we move a package between folders (e.g., reorganising
`packages/observability/audit/` under a different grouping folder) the package
name stays unchanged unless we deliberately rename the category.

## Rule 6 — `workspace:` alignment

Every `workspace:*` / `workspace:^` dep in a `package.json` MUST correspond to a
package that exists in the workspace with the matching name. `npm install`
resolves these against the workspace graph; an unresolved name fails the
install. The workspace should have zero unresolved workspace refs post-rename.

## Rule 7 — Renames + the vendor rename gate

### 7a — SHARED services carry `@figentra/*` (per ADR-0069)

The five SHARED services carry the corporate-operator scope:

| Service       | Package name                      |
| ------------- | --------------------------------- |
| identity      | `@figentra/identity-service`      |
| commerce      | `@figentra/commerce-service`      |
| notifications | `@figentra/notifications-service` |
| observability | `@figentra/observability-service` |
| platform      | `@figentra/platform-service`      |

Per-Application services (`@academorix/api`, `@academorix/ai`) carry the product
scope.

### 7b — Cross-brand rename (`@stackra/*` ↔ `@academorix/*`)

Moving a package from `@stackra/*` to `@academorix/*` (or the reverse) is a
DOMAIN RE-CLASSIFICATION and requires an ADR. It signals the concern moved from
framework-tier to product-tier (or the reverse). Every such rename touches:

- The `package.json` `name` field.
- Every downstream `dependencies` / `devDependencies` / `peerDependencies`
  reference across every `package.json` in the workspace.
- Every `catalog.json` `peer_deps` array.
- Every prose reference in `.md` / steering / ADR / spec files.

## Migration checklist for a new package

Copy-paste checklist for authoring a new package:

- [ ] Decide the scope by asking three questions in order: 1. Is this a portable
      framework primitive any operator could deploy? → `@stackra/*`. 2. Is this
      Figentra's specific cross-application SaaS runtime service? →
      `@figentra/*` (permitted ONLY for the five SHARED services). 3. Otherwise
      (product-specific code): `@<product>/*` — `@academorix/*` for Academorix
      code today.
- [ ] Decide the slug shape: `@stackra/<slug>` (standalone) or
      `@stackra/<category>-<slug>` (part of a bounded context).
- [ ] Slug in kebab-case (Rule 4).
- [ ] No framework prefix (see Rule 2 for the third-party-adapter exception).
- [ ] Physical folder can be anywhere; naming survives moves (Rule 5).
- [ ] `catalog.json` `name:` (if the workspace uses it) matches the package
      name.
- [ ] Docs README doesn't invent a name; uses the canonical package name in
      every code fence.

## Enforcement

Zero-hit greps that must pass:

```sh
# `@figentra/*` outside SHARED services — every hit is a violation.
grep -Eln '"name": "@figentra/' packages/**/package.json apps/*/package.json

# `@figentra/*` in a services/ path OTHER than the five SHARED services.
find services -maxdepth 2 -name package.json \
  ! -path 'services/identity-service/*' \
  ! -path 'services/commerce-service/*' \
  ! -path 'services/notifications-service/*' \
  ! -path 'services/observability-service/*' \
  ! -path 'services/platform-service/*' \
  -exec grep -l '"name": "@figentra/' {} \;
```

Exactly-N-hit grep (positive assertion) — the five SHARED services MUST carry
`@figentra/*`:

```sh
# Must return exactly 5 lines — one per SHARED service.
grep -l '"name": "@figentra/' services/*/package.json
```

## Anti-patterns to reject in review

| Anti-pattern                                                      | Correct                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `@stackra/ts-container`                                           | `@stackra/container`                                        |
| `@stackra/activity-observability` (reversed order)                | `@stackra/observability-activity` (category first)          |
| `@stackra/identity-service` (operator runtime at framework scope) | `@figentra/identity-service` per ADR-0069                   |
| `@figentra/rbac` (framework primitive at operator scope)          | `@stackra/rbac` (framework) or `@academorix/rbac` (product) |
| `@figentra/api` (product code at operator scope)                  | `@academorix/api` (product-specific per-App service)        |
| `@figentra/coach-dashboard` (product code at operator scope)      | `@academorix/coach-dashboard` (product package)             |
| `@stackra/Caching` (PascalCase in slug)                           | `@stackra/caching` (kebab)                                  |
| A `workspace:` dep whose target name doesn't exist                | Fix the typo OR author the missing package                  |

## Related

- [ADR-0057](../../docs/adr/0057-service-local-modules-vs-workspace-packages.md)
  — service-local vs workspace package placement.
- [ADR-0058](../../docs/adr/0058-per-application-service-vendor-split.md) —
  per-Application service vendor split.
- [ADR-0069](../../docs/adr/0069-corporate-operator-vendor-scope.md) —
  corporate-operator vendor scope.
- [brand-hierarchy.md](brand-hierarchy.md) — the Stackra + Figentra + Academorix
  boundary that Rule 1 codifies.
- [hierarchy.md](hierarchy.md) — the platform tree the vendor split aligns with.
- [package-json-conventions.md](package-json-conventions.md) — tier-by-tier
  `package.json` shape.
