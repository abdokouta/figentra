---
inclusion: fileMatch
fileMatchPattern:
  [
    "package.json",
    "LICENSE",
    "README.md",
    "packages/*/package.json",
    "packages/*/*/package.json",
    "apps/*/package.json",
    "services/*/package.json",
  ]
---

# Brand hierarchy — Figentra, Stackra, Academorix

Three distinct brands. Each owns a different layer of the stack. This steering
doc is the canonical rule for what each brand means, what belongs where, and how
the naming shows up in packages, repos, docs, and legal boilerplate.

## The three brands

Three distinct brands with **three npm scopes** — `@stackra/*`, `@figentra/*`,
`@academorix/*` — reflecting three orthogonal ownership axes:

- **Stackra** — framework brand. Portable code library, reusable by any
  operator. Ships as `@stackra/*` (npm).
- **Figentra** — corporate entity + platform operator. Wears two hats:
  - **Legal entity** — copyright, `author` fields, LICENSE, GitHub org. Never
    in a package identifier for this role.
  - **Corporate operator** — Figentra's SaaS platform runtime that hosts every
    application. Cross-application SHARED services (identity, commerce,
    notifications, observability, platform) ship as `@figentra/*` (npm).
- **Academorix** — product brand. Sports-academy SaaS on Figentra's platform.
  Ships as `@academorix/*` (npm).

> **ADR anchor.** The three-scope model is codified by
> [ADR-0069](../../docs/adr/0069-corporate-operator-vendor-scope.md), which
> introduced the `@figentra/*` corporate-operator scope by superseding
> [ADR-0058](../../docs/adr/0058-per-application-service-vendor-split.md)
> §Alternatives §C. ADR-0058's core decision on per-Application services
> (`@<product>/*`) still stands.

**Stackra is not nested inside Figentra** — it's an independent framework brand
that Figentra maintains and consumes, the same way 37signals maintains and
consumes Rails without Rails becoming `@37signals/rails`. Figentra is the
corporation + the corporate operator. Academorix is one of Figentra's products.
Stackra is the framework everyone stands on.

```
  ┌─ Stackra ──────────────────────────────────────────────────────┐
  │  Independent framework brand.                                  │
  │  npm: @stackra/*.                                              │
  │  Designed to be sold, open-sourced, or licensed independently. │
  │  Any operator at any company can build on it.                  │
  └────────────────────────────────────────────────────────────────┘
                              ▲
                              │  builds on
                              │
  ┌─ Figentra ─────────────────────────────────────────────────────┐
  │  Corporation. Legal entity + corporate operator.               │
  │                                                                │
  │  As LEGAL ENTITY:                                             │
  │    Copyright-holds every package in this monorepo.             │
  │    Runs the git org. Owns figentra.com.                        │
  │    Appears in `author` + LICENSE, never in package names.      │
  │                                                                │
  │  As CORPORATE OPERATOR:                                       │
  │    Runs SHARED SaaS platform services (identity, commerce,     │
  │    notifications, observability, platform) — cross-application │
  │    runtime, one deployment per environment.                    │
  │    npm: @figentra/*.                                          │
  │    Distinct from Stackra framework (portable code) and         │
  │    Academorix product (specific application).                  │
  │                                                                │
  │  Ships products:                                              │
  │  ┌─ Academorix ─────────────────────────────────────────────┐  │
  │  │  Product. Sports-academy SaaS built on Stackra,          │  │
  │  │  running on Figentra's SHARED services.                  │  │
  │  │  npm: @academorix/*.                                     │  │
  │  │  Sports vocabulary legitimate here, never in Stackra.    │  │
  │  └──────────────────────────────────────────────────────────┘  │
  │  ┌─ Future products ────────────────────────────────────────┐  │
  │  │  Also build on Stackra + Figentra's SHARED services.     │  │
  │  │  Get their own product scope (@<product>/*).             │  │
  │  └──────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────┘

  Legend:
    Stackra is a peer of Figentra as brands, not owned by it in a brand sense.
    Figentra AS OPERATOR consumes Stackra (framework) + runs SHARED services.
    Academorix is owned by Figentra, not by Stackra.
    A third-party operator could build on Stackra without Figentra — they'd
    ship their own @<their-operator>/* SHARED services.
```

Precedent — frameworks that are legally / brand-wise independent from the
companies that heavily use or maintain them:

| Framework (independent brand) | Company that maintains + uses it    | Their products                           |
| ----------------------------- | ----------------------------------- | ---------------------------------------- |
| **Symfony**                   | SensioLabs                          | SensioLabs consulting products           |
| **Rails**                     | 37signals (core contributor)        | Basecamp, Hey                            |
| **Django**                    | Django Software Foundation          | (consumed by many companies)             |
| **PostgreSQL**                | PostgreSQL Global Development Group | Aurora (AWS), Cloud SQL (Google), Neon   |
| **Stackra**                   | **Figentra + community**            | **Academorix, future Figentra products** |

37signals contributes to Rails and uses Rails heavily, but Rails isn't
`@37signals/rails` — it's `rails/rails`. Same shape here: Figentra maintains and
uses Stackra, but Stackra keeps its own scope so a future open-source,
spin-off, or third-party consumer inherits a legible framework brand rather than
a corporate-parent name.

The Meta / Google / Vercel precedent (React inside Meta, Angular inside Google)
is a DIFFERENT pattern — those frameworks are internally-first, owned by their
parent. Stackra is the Rails-style pattern: independent brand, one primary
corporate maintainer today, designed to survive that maintainer.

### Corporate operator precedent

The `@figentra/*` scope for SHARED runtime services follows a different — but
well-established — industry precedent. When a company builds SaaS on top of a
portable framework, the company publishes its OPERATOR-specific runtime services
under the company's own brand, while consuming the framework's brand unchanged:

| Framework (portable code)     | Corporate operator (SaaS runtime)             | Product (specific app)          |
| ----------------------------- | --------------------------------------------- | ------------------------------- |
| **PostgreSQL** (`postgres`)   | Supabase (hosted runtime)                     | apps built on Supabase          |
| **Django** (`django/*`)       | Instagram's shared infra (private)            | Instagram, Threads              |
| **Ruby on Rails** (`rails/*`) | Basecamp's shared infra (private)             | Basecamp, Hey                   |
| **Stackra** (`@stackra/*`)    | **Figentra's SHARED services (`@figentra/*`)**| **Academorix (`@academorix/*`)**|

Every row: framework brand stays clean and portable; the OPERATOR's runtime
services carry the OPERATOR's identity; the PRODUCT lives at its own scope.
Three layers, three scopes, no ambiguity.

## Layer boundaries — what belongs where

### Figentra layer

Figentra wears two hats. Each has different visibility rules.

#### As legal entity (invisible in package names)

Figentra is a legal entity. It owns:

- **Git-host organization** — every repo lives under the `figentra` org /
  top-level group. On GitHub: `github.com/figentra/<repo>`. On GitLab:
  `gitlab.com/figentra/<repo>` (Shape A) or
  `gitlab.com/figentra/<stackra|academorix>/<repo>` (Shape B). See the
  §"Repositories on Git hosts" section below for host-specific rules.
- **LICENSE files** — `Copyright (c) YEAR Figentra L.L.C.`
- **`author` field** in every `package.json`.
- **Trademark + copyright notices** in generated docs, README hero, etc.
- **Domain names** — `figentra.com`, plus product-scoped subdomains.
- **DPA / TOS / privacy policy** boilerplate.

In this role, Figentra NEVER shows up in:

- Framework package names — `@figentra/rbac` is FORBIDDEN. Framework code
  carries the `@stackra/*` scope.
- Product package names — `@figentra/coach-dashboard` is FORBIDDEN. Product code
  carries the `@<product>/*` scope (Academorix ships `@academorix/api` today).
- Directory names in a repo (no `packages/figentra/`).
- Class names, symbol names, config keys.

#### As corporate operator (visible for SHARED runtime services)

Figentra also runs the SaaS platform. In this role — publishing SHARED runtime
services that host every application — Figentra IS visible in package names:

- **npm scope**: `@figentra/*` — SHARED runtime services:
  - `@figentra/identity-service` — identity plane (JWKS, session tokens, MFA).
  - `@figentra/commerce-service` — commerce plane (subscription, entitlements,
    payment).
  - `@figentra/notifications-service` — notifications plane (in-app, mail, push,
    sms).
  - `@figentra/observability-service` — observability plane (audit, activity,
    monitoring).
  - `@figentra/platform-service` — platform plane (settings, features, ops).

Rules `@figentra/*` packages MUST follow:

1. **Cross-application by construction.** Every SHARED service serves every
   application deployed on Figentra's platform. Product-specific vocabulary
   (Sports, Coach, Athlete) belongs in `@academorix/*`, never in `@figentra/*`.
2. **Operator-specific, not portable.** A hypothetical second corporate operator
   building on Stackra ships their own `@<their-operator>/*` SHARED services —
   they wouldn't consume `@figentra/*`. Contrast with `@stackra/*` which any
   operator can consume.
3. **Compose Stackra framework, not the reverse.** `@figentra/identity-service`
   composes `@stackra/auth`, `@stackra/tenancy`, etc. `@stackra/*` never imports
   from `@figentra/*`.

Rules `@figentra/*` packages MUST NOT do:

1. **Ship framework primitives.** Generic HTTP clients, generic RBAC, generic
   observability abstractions belong in `@stackra/*`. If a Figentra runtime
   service extracts a reusable primitive, it moves to `@stackra/*` and Figentra
   composes it back in.
2. **Carry product-specific code.** Sports vocabulary, coach dashboards, athlete
   records — those live in `@academorix/*`. Figentra's SHARED services are
   application-agnostic.

### Stackra layer (framework)

Stackra is the framework brand — a technology story Figentra could sell
independently, open-source, or license to other companies without changing its
identity. Stackra owns:

- **npm scope**: `@stackra/*` — the TypeScript framework packages in this
  monorepo.
- **Repository names**: `stackra` (if extracted as a standalone),
  `stackra-backend`.
- **Domain**: `stackra.com` (dev + docs surface).
- **Cross-cutting steering docs** — anything under `.kiro/steering/*.md` that
  documents framework rules.

Rules Stackra packages MUST follow:

1. **Domain-agnostic.** No sports vocabulary — no "coach", "athlete", "team",
   "session", "facility", "booking" in Stackra symbol names or docs. If a
   Stackra package uses those words, it's a boundary violation.
2. **Reusable by any product.** `@stackra/rbac`, `@stackra/http`, `@stackra/ui`,
   `@stackra/notifications` should be installable by a fintech app or a
   healthcare app without a rewrite.
3. **Framework primitives only** — building blocks, not features. A Stackra
   package ships the tools; an Academorix package ships the application.

### Academorix layer (product)

Academorix is a product brand — the sports-academy SaaS Figentra ships today. It
owns:

- **Directory names**: `apps/academorix-*`, `packages/academorix/*` (when we
  author product-scoped packages).
- **Repository names**: `academorix-clients` (this repo), potentially
  `academorix-marketing`, `academorix-mobile` as future extractions.
- **Domain**: `academorix.com` (customer-facing), potentially
  `admin.academorix.com`, `app.academorix.com`.
- **Product-scoped packages** — if we ship any, they live under the
  `@academorix/*` npm scope.

Rules Academorix packages MUST follow:

1. **May freely reference sports vocabulary.** "Coach", "athlete", "team",
   "season", "facility" are legitimate first-class citizens.
2. **Depend on Stackra, never the reverse.** `@academorix/coach-dashboard` can
   import from `@stackra/ui`; `@stackra/ui` never imports from `@academorix/*`.
3. **Product-scoped, tenant-specific.** Business logic that only makes sense for
   sports academies lives here.

Today the workspace ships FOUR `@academorix/*` deployables: `apps/dashboard`
(Vite SPA) + `apps/landing` (Vite SPA) — both inside `academorix/frontend`;
`apps/family` (React Native — parents + athletes) + `apps/coach` (React Native —
coaches + admins + academy staff) — both inside `academorix/mobile`. Deploy
topology mirrors the two-monorepo split: one monorepo per platform (web +
mobile), N deployables per monorepo. The two RN apps are two flavors of ONE
bundle per the 2026-08-06 mobile split (see `.kiro/steering/doppler.md` §"Legacy
`stackra-*` project names"). Product-scoped packages will land as the sports
domain grows.

## Concrete naming rules

### Repositories on Git hosts

Two supported Git hosts. GitHub is the primary; GitLab is the mirror /
self-hosted fallback. Pick ONE canonical URL per repo and mirror the other —
never let the two hosts drift into different names.

#### GitHub — flat org (only shape GitHub supports)

GitHub organizations are flat — subgroups don't exist. Every repo lives at
`github.com/figentra/<name>`:

| Repo                            | Owns                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `figentra/stackra-backend`      | Backend framework (`@stackra/*` packages) + services + backend product-scoped packages (`@academorix/*`). |
| `figentra/academorix-clients`   | This repo. Frontend framework (`@stackra/*` npm) + client apps.               |
| `figentra/academorix-marketing` | Marketing site (future).                                                      |
| `figentra/figentra-brand`       | Design assets + brand guidelines (future).                                    |

Never nest brand names in a repo path (`figentra/stackra/academorix` is wrong —
that's a tree, not a repo). Each repo name reflects the artifact's SCOPE, not
the brand chain.

#### GitLab — nested groups (recommended shape for a self-hosted mirror)

GitLab supports nested subgroups, which map to the brand hierarchy more
literally than GitHub's flat orgs can. Two acceptable shapes — pick ONE and
stick to it across every repo:

**Shape A: Flat (GitHub-compatible mirror).** Every repo lives at
`gitlab.com/figentra/<name>`. URL-for-URL identical to the GitHub shape — easy
mirror, easy migration in either direction:

```
gitlab.com/figentra/
├── stackra-backend
├── academorix-clients
├── academorix-marketing
└── figentra-brand
```

**Shape B: Nested subgroups (leverages GitLab's feature).** Group the repos
under `stackra/` (framework) and `academorix/` (product) subgroups. Cleaner
brand hierarchy in the URL, but breaks mirror-URL parity with GitHub:

```
gitlab.com/figentra/
├── stackra/                      # framework subgroup
│   └── stackra-backend
├── academorix/                   # product subgroup
│   ├── academorix-clients
│   └── academorix-marketing
└── figentra-brand                # corporate assets — no subgroup
```

**Which to pick:**

- **Flat (Shape A) if you're mirroring GitHub ↔ GitLab** (most common case —
  GitHub for the OSS story, GitLab for internal CI or on-prem). URLs stay
  portable, tooling that hardcodes org/repo pairs works cross-host.
- **Nested (Shape B) if GitLab is the sole authoritative host** and you'll never
  mirror to GitHub. The subgroup hierarchy earns its keep when you have 20+
  repos and want visual grouping in the GitLab UI.

The workspace's current recommendation: **Shape A (flat)** — GitHub is the
primary, GitLab (if used) mirrors it. Migrate to Shape B only if the GitHub
relationship dissolves and repo count grows past ~15.

Regardless of shape, the `.git/config` remote URL must be one of:

```bash
# GitHub
git remote set-url origin git@github.com:figentra/academorix-clients.git

# GitLab, Shape A (flat)
git remote set-url origin git@gitlab.com:figentra/academorix-clients.git

# GitLab, Shape B (nested subgroups)
git remote set-url origin git@gitlab.com:figentra/academorix/academorix-clients.git
```

Never let the local remote URL drift into a form that mixes brand identifiers
with paths (`git@gitlab.com:figentra/stackra-academorix.git` is wrong — that's
Shape A pretending to be Shape B).

#### Self-hosted (Gitea, Forgejo, Bitbucket Server, etc.)

Every self-hosted Git server supports flat orgs; a few (Gitea 1.20+, Forgejo)
support nested groups. Same rule as GitLab: pick Shape A OR Shape B per host,
don't mix. If the self-hosted server is a mirror of GitHub, use Shape A for URL
parity.

#### Current-reality — GitLab is primary; mirrors are the exception

The workspace's shipped topology diverges from the historical "GitHub is
primary" guidance above. As of 2026-08-08, every workspace repo lives on
GitLab.com in one of three top-level namespaces that mirror the vendor scope:

| GitLab namespace | Owns                                       | Example repos                                                        |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `stackra/*`      | Framework code — portable primitives       | `stackra/frontend/framework`, `stackra/backend/rbac`                 |
| `figentra-inc/*` | Corporate operator — SaaS runtime + tools  | `figentra-inc/workspace`, `figentra-inc/backend/identity-service`    |
| `academorix/*`   | Product code — Academorix-specific runtime | `academorix/mobile`, `academorix/frontend`, `academorix/backend/api` |

Nested subgroups under those top-level namespaces (`stackra/frontend/*`,
`figentra-inc/backend/*`) are used freely — Shape B per this section's earlier
guidance.

**Rule — GitLab is the primary git host. Mirrors to other hosts (GitHub,
Bitbucket, Gitea) land ONLY when a specific vendor integration requires it.**

Every mirror ships as a **one-way push mirror**: GitLab is the SOT; the mirror
is a dumb code copy that a vendor's tooling reads. No PRs, no CI writes, no
governance policies flow back from the mirror. Devs work exclusively on GitLab.

Adding a new mirror requires:

1. Naming the specific vendor-only feature the mirror unlocks (dashboard
   trigger, PR previews, auto-build on push, etc.).
2. An ADR OR a `.kiro/reports/*` decision note explaining why the vendor
   requires the specific mirror host + why the feature justifies the ongoing
   maintenance cost (token rotation, mirror sync monitoring).
3. The mirror path MUST match the source path EXACTLY (no rename, no re-scope).
   E.g., `gitlab.com/academorix/mobile` mirrors to
   `github.com/academorix/mobile`, never to
   `github.com/figentra-inc/academorix-mobile`.

**Applied cases (2026-08-08):**

| Source                         | Mirror target                  | Reason                                                                                              |
| ------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `gitlab.com/academorix/mobile` | `github.com/academorix/mobile` | Expo Workflows + auto-trigger + PR-preview UX + dashboard "Run workflow" button are GitHub-App-only |

Every other workspace repo (~130 as of writing) stays GitLab-only. Adding a
second mirror requires the ADR/report per the rule above — no informal
mirroring.

### npm packages

```
@stackra/rbac                # Framework — RBAC UI + hooks (generic, portable)
@stackra/ui                  # Framework — HeroUI-based UI kit (generic, portable)
@figentra/identity-service   # Operator — Figentra's SaaS identity runtime
@academorix/coach-dashboard  # Product — coach-specific dashboard (sports)

# Framework primitives at operator or product scopes:
@figentra/rbac               # ❌ FORBIDDEN — RBAC is a framework primitive
@academorix/rbac             # ❌ FORBIDDEN — same reason
```

### Services — vendor scope reflects owning brand

> **ADR anchor.** The three-scope service model is codified by
> [ADR-0069](../../docs/adr/0069-corporate-operator-vendor-scope.md), which
> introduced the `@figentra/*` corporate-operator scope by superseding
> [ADR-0058](../../docs/adr/0058-per-application-service-vendor-split.md)
> §Alternatives §C. ADR-0058's per-Application-services decision (`@<product>/*`)
> still holds.

Every service under `services/*/` in this repo carries a package name that
reflects **which brand owns the runtime**, not which corporation legally-owns it
(Figentra owns the copyright on every service — that's the legal-entity role,
invisible in the package name).

| Service       | Scope               | Package name                      | Owning brand         |
| ------------- | ------------------- | --------------------------------- | -------------------- |
| identity      | SHARED              | `@figentra/identity-service`      | Figentra (operator)  |
| commerce      | SHARED              | `@figentra/commerce-service`      | Figentra (operator)  |
| notifications | SHARED              | `@figentra/notifications-service` | Figentra (operator)  |
| observability | SHARED              | `@figentra/observability-service` | Figentra (operator)  |
| platform      | SHARED              | `@figentra/platform-service`      | Figentra (operator)  |
| api           | ONE PER APPLICATION | `@academorix/api`                 | Academorix (product) |
| ai            | ONE PER APPLICATION | `@academorix/ai`                  | Academorix (product) |

Rules:

- **SHARED services** carry `@figentra/<slug>-service`. They belong to Figentra
  as corporate operator — cross-application runtime, one deployment per
  environment. A future Figentra product built on Stackra deploys the same five
  services under the same names (they're Figentra's runtime, not the product's).
  A hypothetical third-party operator building on Stackra ships their own
  `@<their-operator>/*` SHARED services — not these.
- **Per-Application services** carry `@<product>/<slug>`. They belong to their
  owning product. Academorix's per-Application services are `@academorix/api` +
  `@academorix/ai`. A future Figentra product would ship `@<product>/api` +
  `@<product>/ai` alongside the same Figentra SHARED services.
- **Framework code never carries an operator or product scope.** Reusable
  primitives live under `@stackra/*` regardless of who deploys them.
- **`@figentra/*` is permitted EXCLUSIVELY for SHARED runtime services.** It
  remains forbidden for framework packages (`packages/**`), framework templates
  (`templates/{microservice,vite,react-native}/`), and product code (Academorix
  or future-product packages/services).

Directory location does not change with vendor scope. All services live in
`services/*/` per package-naming.md Rule 5 (folder path is human organisation;
package name is the shipped identifier).

### `author` field in `package.json`

Every package's `author` field names the LEGAL owner — Figentra — not the brand:

```jsonc
{
  "author": {
    "name": "Figentra L.L.C",
    "email": "dev@figentra.com",
    "url": "https://figentra.com",
  },
}
```

Not `Stackra L.L.C` (Stackra is a product/brand, not a legal entity). Not
`Academorix L.L.C` (same reason).

Consumers see `Figentra L.L.C` in npm metadata → they know the corporate owner.
They see `@stackra/*` in the package name → they know the framework brand. Both
stay legible.

### `LICENSE` files

```
MIT License

Copyright (c) YEAR Figentra L.L.C.

Permission is hereby granted, ...
```

Legal owner = Figentra. Every `@stackra/*` package ships with its own `LICENSE`
file carrying this exact copyright line.

### README hero paragraph

The root README's opening frames the three-brand hierarchy in one sentence:

```
This monorepo ships Academorix — Figentra's sports-academy SaaS — built
on Stackra, the framework Figentra publishes as `@stackra/*`.
```

Every package README's opening states the package's role within Stackra:

```
`@stackra/rbac` — the RBAC surface of the Stackra framework. Ships a
headless service, five React hooks, four HeroUI Pro components, and
route records.
```

No package README opens with "Figentra's RBAC library" or "Academorix's RBAC
library" — the framework brand is what consumers install.

## Anti-patterns to reject

| Anti-pattern                                              | Why it's wrong                                                                | Fix                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@figentra/rbac` on npm                                   | Framework primitive at operator scope                                         | `@stackra/rbac`                                                                                                                         |
| `@figentra/http-client`, `@figentra/logger`               | Framework primitives at operator scope                                        | `@stackra/http`, `@stackra/logger`                                                                                                      |
| `@stackra/identity-service`                               | Operator SaaS runtime at framework scope                                      | `@figentra/identity-service` (SHARED services carry operator scope)                                                                     |
| `@stackra/api`, `@stackra/ai`                             | Product-scoped code at framework scope                                        | `@academorix/api`, `@academorix/ai`                                                                                                     |
| `@stackra/coach-dashboard`                                | Sports vocabulary in a framework package                                      | `@academorix/coach-dashboard`                                                                                                           |
| `@academorix/rbac`                                        | Product scope for a generic primitive                                         | `@stackra/rbac`                                                                                                                         |
| `@figentra/coach-dashboard`, `@figentra/athlete-registry` | Product-specific code at operator scope                                       | `@academorix/coach-dashboard`, `@academorix/athlete-registry`                                                                           |
| Sports terms in `@stackra/*` OR `@figentra/*` source      | Framework/operator scopes leaking product vocabulary                          | Move to `@academorix/*`                                                                                                                 |
| Framework primitives in `@academorix/*` OR `@figentra/*`  | Non-framework scope duplicating framework                                     | Move to `@stackra/*`                                                                                                                    |
| `author: "Stackra L.L.C"` in a package.json               | Stackra isn't a legal entity                                                  | `author: "Figentra L.L.C"`                                                                                                              |
| `author: "Figentra Operator L.L.C"` (or similar)          | Operator is a role, not a separate legal entity                               | `author: "Figentra L.L.C"` (same legal entity across all roles)                                                                         |
| `Copyright (c) YEAR Stackra L.L.C` in a LICENSE           | Same                                                                          | `Copyright (c) YEAR Figentra L.L.C`                                                                                                     |
| `github.com/stackra/academorix-clients`                   | Framework brand as GitHub org                                                 | `github.com/figentra/academorix-clients`                                                                                                |
| `gitlab.com/stackra/academorix-clients`                   | Same, GitLab flavour                                                          | `gitlab.com/figentra/academorix-clients`                                                                                                |
| `gitlab.com/figentra/stackra/academorix/clients` (3-deep) | Nested past two levels leaks the brand tree into URL depth                    | `gitlab.com/figentra/academorix/academorix-clients` (Shape B, one subgroup) OR `gitlab.com/figentra/academorix-clients` (Shape A, flat) |
| Mixing Shape A + Shape B across repos in the same host    | URL parity is per-host — mixing shapes breaks tooling that walks org listings | Pick one shape per host; document the choice                                                                                            |
| `figentra-frontend`, `figentra-backend` as repo names     | Legal-entity in artifact scope                                                | `academorix-clients`, `stackra-backend`                                                                                                 |

## Migration notes

- **Root workspace name** — `academorix-clients` (this repo). Renamed from
  `academorix-frontend` on 2026-07-27; see
  [`docs/monorepo-structure.md`](../../docs/monorepo-structure.md).
- **Git remote** — points at `github.com/academorix/academorix-frontend` today.
  Migrating to `github.com/figentra/academorix-clients` requires (1) creating
  the `figentra` GitHub org, (2) transferring the repo, (3) updating
  `git remote set-url origin` locally. If a GitLab mirror is planned, add it as
  a second remote
  (`git remote add gitlab git@gitlab.com:figentra/academorix-clients.git`) after
  the primary transfer — pick Shape A (flat) for URL parity with GitHub, per the
  §"Repositories on Git hosts" recommendation.
- **`author` fields** — every `package.json` currently says `Stackra L.L.C`.
  Bulk update to `Figentra L.L.C` is a one-line sed across the package set; do
  it as a chore commit.
- **`LICENSE`** — root `LICENSE` currently says `Copyright (c) 2024 Next UI`
  (stray boilerplate from the HeroUI Pro fork). Update to
  `Copyright (c) 2026 Figentra L.L.C`.
- **Package READMEs** — most opening paragraphs frame the package as
  Stackra-scoped. That's correct — Stackra is the framework brand. Don't edit
  these to say "Figentra's" unless the sentence is specifically about corporate
  ownership.

## Cross-references

- [`.kiro/steering/package-naming.md`](package-naming.md) — the mechanical npm
  naming rules (framework layer + scopes).
- [`docs/monorepo-structure.md`](../../docs/monorepo-structure.md) — the
  frontend/backend split decision + repo layout.
- [`.ref/steering/frontend-packages.md`](../../.ref/steering/frontend-packages.md) — package
  architecture (ADR-0023).
- [`README.md`](../../README.md) — root onboarding walkthrough.

## When you're tempted

- **"Everything Figentra ships should be `@figentra/*`."** No. Three axes, three
  scopes. Framework code → `@stackra/*` regardless of who deploys. Product code →
  `@<product>/*` regardless of who runs it. Operator's SHARED runtime →
  `@figentra/*`. When ambiguous, ask three questions in order: (1) "is this a
  reusable primitive any operator could deploy?" → framework. (2) "is this
  application-specific code?" → product. (3) "is this Figentra's specific
  cross-application SaaS runtime?" → operator.

- **"But everyone says Stackra when they mean Figentra."** Marketing overlap is
  fine (the URL `stackra.com` can point at Figentra's dev landing page). Legal
  boundaries are not fine — `Copyright (c)` must name the legal entity, always
  Figentra L.L.C, regardless of the scope on the package.

- **"We should namespace by product to prevent conflicts."** No two Figentra
  products should ever conflict on a Stackra package name — if they need
  different behavior, one uses `@stackra/rbac` directly and the other builds a
  product-scoped wrapper (`@academorix/rbac-config`) that DEPENDS ON
  `@stackra/rbac`. Never fork the framework per product.

- **"If Figentra is both operator and legal entity, why not one scope for
  everything?"** Because the two roles have different portability. Legal entity
  is invisible in artifact names by design (a package should read independently
  of who owns the copyright). Operator role is a runtime identity that consumers
  see explicitly (a `pnpm add` on `@figentra/identity-service` tells the reader
  "you're pinning Figentra's specific SaaS identity runtime"). Same corporation,
  two visibility rules.
