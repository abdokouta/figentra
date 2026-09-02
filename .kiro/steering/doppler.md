---
inclusion: fileMatch
fileMatchPattern:
  [
    "**/.doppler.yaml",
    "**/doppler.yaml",
    "**/.env*",
    "**/wrangler.toml",
    "**/package.json",
  ]
---

# Doppler

Every runtime secret comes from Doppler. Zero real secret values live in this
repo — only Doppler config bindings live here. This steering is the canonical
rule of record;
[ADR-0056](../../.docs/adr/0056-doppler-project-per-deployable-app.md) is the
decision record. Read its **Amendment 2026-08-06** — that section explains the
two-workplace split that landed to accommodate the 10-project cap on Doppler's
free plan.

## The rule — one Doppler project per deployable

Every DEPLOYABLE unit gets its own Doppler project. A deployable is:

- A backend service under `services/<name>/` (ships to production).
- A client app under `apps/<name>/` (ships to production).
- The workspace root (holds workspace-wide tooling secrets that don't belong to
  any single service or app).

Templates under `templates/<flavor>/` are NOT deployables. They are scaffolds
the `pnpm bootstrap:*` scripts copy from; they never bind to a live Doppler
project (the bootstrap script writes a fresh `.doppler.yaml` into the copied
directory pointing at whatever Doppler project the operator provisions).

## Two-workplace split — 13 projects across 2 workplaces

Doppler's free plan caps a workplace at 10 projects. The workspace has 13
deployables. To honour ADR-0069's brand model AND stay on the free plan, the
projects split across TWO Doppler workplaces along the operator-vs-product
boundary:

- **`academorix` workplace** (personal account: `academorix@gmail.com`, id
  `915622ae562f27493a75`) — Academorix product line. 6 projects.
- **`Figentra Technologies` workplace** (personal account: `figentra@gmail.com`,
  id `ed61d82344aefe5f3c01`) — Figentra corporate-operator services +
  workspace-tooling. 7 projects.

The split mirrors the npm package-scope model from
[ADR-0069](../../.docs/adr/0069-corporate-operator-vendor-scope.md):
`@academorix/*` packages → academorix workplace; `@figentra/*` packages →
figentra workplace; framework tooling → figentra workplace (workspace-tooling
belongs to the corporate operator).

### Canonical project inventory

| #   | Workplace  | Doppler project          | Deployable                                                       | File path                                      |
| --- | ---------- | ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------- |
| 1   | figentra   | `figentra-workspace`     | Workspace root (Turbo cache, HeroUI Pro, Changesets, npm, Jira)  | `/.doppler.yaml`                               |
| 2   | figentra   | `figentra-identity`      | SHARED Identity service (operator runtime)                       | `services/identity-service/.doppler.yaml`      |
| 3   | figentra   | `figentra-commerce`      | SHARED Commerce service (operator runtime)                       | `services/commerce-service/.doppler.yaml`      |
| 4   | figentra   | `figentra-notifications` | SHARED Notifications service (operator runtime)                  | `services/notifications-service/.doppler.yaml` |
| 5   | figentra   | `figentra-observability` | SHARED Observability service (operator runtime)                  | `services/observability-service/.doppler.yaml` |
| 6   | figentra   | `figentra-platform`      | SHARED Platform service (operator runtime)                       | `services/platform-service/.doppler.yaml`      |
| 7   | figentra   | `figentra-landing`       | Next.js marketing site (Figentra corporate)                      | `apps/figentra-landing/.doppler.yaml`          |
| 8   | academorix | `academorix-api`         | Per-App tenant API                                               | `services/api/.doppler.yaml`                   |
| 9   | academorix | `academorix-ai`          | Per-App Python AI runtime (FastAPI + LangGraph)                  | `services/ai/.doppler.yaml`                    |
| 10  | academorix | `academorix-dashboard`   | Tenant SPA (Vite + Refine + HeroUI Pro)                          | `apps/academorix-dashboard/.doppler.yaml`      |
| 11  | academorix | `academorix-family`      | React Native family mobile app (parents + athletes)              | `apps/academorix-family/.doppler.yaml`         |
| 12  | academorix | `academorix-coach`       | React Native coach mobile app (coaches + admins + academy staff) | `apps/academorix-coach/.doppler.yaml`          |
| 13  | academorix | `academorix-landing`     | Next.js marketing site (Academorix Sports)                       | `apps/academorix-landing/.doppler.yaml`        |

Two boundaries to remember:

- **Academorix apps + backend go to the academorix workplace.** Six projects
  today: `academorix-api` (TypeScript Worker), `academorix-ai` (Python),
  `academorix-dashboard`, `academorix-family`, `academorix-coach`,
  `academorix-landing`.
- **Figentra SHARED services + workspace-tooling + Figentra landing go to the
  figentra workplace.** Framework-tooling secrets (Turbo cache, HeroUI Pro
  license, GitLab tokens, Sentry auth) live in `figentra-workspace` because the
  corporate operator owns the framework-tier tooling.

Adding a 14th deployable = a new Doppler project under the appropriate workplace
(respect the boundary above). Each workplace still has its own 10-project cap;
monitor both (academorix 6/10, figentra 7/10 — 3-4 slots headroom each).

## Two MCP servers — one per workplace

The workspace's Doppler MCP config ships TWO servers, one per workplace. This
lets agents operate on both workplaces without swapping tokens:

```jsonc
// .kiro/settings/mcp.json (gitignored — carries live tokens)
{
  "mcpServers": {
    "doppler-academorix": {
      "command": "npx",
      "args": ["-y", "@dopplerhq/mcp-server"],
      "env": { "DOPPLER_TOKEN": "<academorix personal token>" },
    },
    "doppler-figentra": {
      "command": "npx",
      "args": ["-y", "@dopplerhq/mcp-server"],
      "env": { "DOPPLER_TOKEN": "<figentra personal token>" },
    },
  },
}
```

Tool routing:

- `mcp_doppler_academorix_*` — every operation on the `academorix` workplace
  (all 5 `academorix-*` projects).
- `mcp_doppler_figentra_*` — every operation on the `Figentra Technologies`
  workplace (all 7 `figentra-*` + `figentra-workspace` projects).

Choosing the wrong tool for a project surfaces a `project not found` error —
Doppler tokens are workplace-scoped. Agents that need to work across both
workplaces (rare — most tasks touch one) invoke tools from both prefixes.

## One `.doppler.yaml` per deployable

Every deployable ships EXACTLY one `.doppler.yaml` at its root — the git-tracked
source of truth for that deployable's project + config binding. Traditional
single-project shape:

```yaml
# apps/academorix-dashboard/.doppler.yaml
setup:
  project: academorix-dashboard
  config: dev
```

## Why per-deployable files, not one root file

The 2026-07-27 Amendment to ADR-0056 tried a single root file with a
multi-project `setup:` array per Doppler CLI PR-374. Empirical verification on
CLI 3.76.1 showed the CLI never opens the workspace-root `.doppler.yaml` — it
only consults `~/.doppler/.doppler.yaml` (the per-scope bindings written by
`doppler setup`). Amendment 2026-07-28 reverted to per-deployable files, and
Amendment 2026-08-06 kept that shape while splitting projects across two
workplaces.

The per-deployable model:

- **Works on every Doppler CLI version.** Traditional single-project
  `.doppler.yaml` is the shape every version has supported.
- **Git-tracked next to the code.** Reviewers see the Doppler binding in the
  same folder as `package.json`. No cross-file lookup.
- **Isolates blast radius.** A leaked service token for `academorix-family` can
  only list `academorix-family/dev` secrets, not the entire workspace.
- **Onboarding stays one command** via `pnpm doppler:setup` (see below) — the
  script fans out to every `.doppler.yaml` and writes bindings to
  `~/.doppler/.doppler.yaml`.

## Onboarding — `pnpm doppler:setup`

Doppler CLI does NOT read the workspace `.doppler.yaml` files at `doppler run`
time. It reads `~/.doppler/.doppler.yaml` — the CLI's own per-scope binding file
— which `doppler setup` populates. Every new workstation therefore needs one
`doppler setup` per deployable. The `pnpm doppler:setup` script automates that
fan-out:

```sh
npm install
doppler login              # once per machine — must be authed to BOTH accounts
pnpm doppler:setup         # binds every deployable in one pass
pnpm doppler:setup:dry     # preview without invoking the CLI
```

Because the workspace's projects now split across two Doppler accounts, the CLI
must be authed to the account that owns each project. Two ways:

- **Simplest**: log into one account at a time — `doppler login` (interactive
  prompt selects account) — then run `pnpm doppler:setup` twice, once per
  account. Doppler CLI keeps per-scope token overrides, so bindings from a
  previous session persist across account swaps.
- **Recommended for CI**: use per-project **service tokens**
  (issued from each Doppler dashboard's Access → Service Tokens page). Service
  tokens are workplace-scoped, non-interactive, and don't require
  `doppler login`. Each service's deploy pipeline gets its own service token
  scoped to `<project>/<config>` (never a personal token in CI).

After `pnpm doppler:setup` runs, every `doppler run --` from any subdirectory
resolves to the right project.

## Naming convention

Follows the brand hierarchy (`.kiro/steering/brand-hierarchy.md`) + the
six-service split (ADR-0032) + the three-vendor-scope model (ADR-0069):

- **Workspace root** → `figentra-workspace`. Named after the corporate operator
  because the root project holds workspace-tooling secrets (Turbo cache token,
  HeroUI Pro postinstall license, Changesets/npm publish tokens, Sentry auth,
  OneUptime API key, Slack webhooks) — Figentra owns the corporate operator
  surface per ADR-0069.
- **SHARED runtime services** (cross-application per ADR-0032; corporate-
  operator scope per ADR-0069) → `figentra-<service-slug>`. Slug matches the
  service name minus the `-service` suffix: `identity-service` →
  `figentra-identity`; `observability-service` →
  `figentra-observability`. Applies to the five SHARED services (identity,
  commerce, notifications, observability, platform).
- **Per-Application services** (per ADR-0032 + ADR-0058) → `<product>-<slug>`.
  For Academorix: `academorix-api` (TypeScript tenant API Worker) +
  `academorix-ai` (Python FastAPI AI runtime).
- **Product apps** → `<product>-<app-slug>`. For Academorix:
  `academorix-family`, `academorix-coach`, `academorix-dashboard`,
  `academorix-landing`.
- **Corporate landing** → `figentra-landing` (Next.js marketing site under the
  figentra workplace).

**Never** invent hybrids like `stackra-academorix-*` or `figentra-academorix-*`
or use dotted-suffix config names like `dev_dashboard`. Every deployable gets
its own project with plain `dev` / `stg` / `prd` configs.

### Legacy `stackra-*` project names (retired 2026-08-06)

Before ADR-0069 amendments landed:

| Legacy project name       | New project name         | New workplace    |
| ------------------------- | ------------------------ | ---------------- |
| `figentra-workspace`      | `figentra-workspace`     | figentra         |
| `stackra-identity`        | `figentra-identity`      | figentra         |
| `stackra-commerce`        | `figentra-commerce`      | figentra         |
| `stackra-notifications`   | `figentra-notifications` | figentra         |
| `stackra-observability`   | `figentra-observability` | figentra         |
| _(no `stackra-platform`)_ | `figentra-platform`      | figentra (new)   |
| `academorix-parent`       | `academorix-family`      | academorix       |
| _(no `academorix-coach`)_ | `academorix-coach`       | academorix (new) |
| _(no `figentra-landing`)_ | `figentra-landing`       | figentra (new)   |

The 2026-08-06 rebuild followed the §"Backup + restore playbook" below. Backups
live at
`/Users/akouta/Projects/figentra-workspace/.tmp/doppler-backup-2026-08-06/`. The
parent-vs-family rename reflects the Option B two-app mobile split (family =
parents + athletes; coach = coaches + admins + academy staff).

## Config naming

Every project uses exactly three canonical configs (Doppler auto-creates them at
project creation):

- `dev` — developer workstations + PR previews. Every `.doppler.yaml` pins
  `config: dev` as the default binding.
- `stg` — staging / TestFlight / Play internal / preview deploy.
- `prd` — production / App Store / Play production / live deploy.

`dev_personal` is tolerated (Doppler auto-creates one for the authenticated
workplace user) but not required.

Never use `dev_<slug>` / `stg_<slug>` / `prd_<slug>` config names — that's a
leftover from the single-central-project shape that this workspace retired in
ADR-0056.

## File placement + naming

- **Exactly one** `.doppler.yaml` per deployable (leading dot; hidden alongside
  `.env*`, `.editorconfig`, `.gitignore`). Never `doppler.yaml` (no dot) — the
  workspace convention is uniform.
- **No sub-file inside a deployable dir.** A deployable's directory contains ONE
  `.doppler.yaml` at its root, next to its `package.json`.
  Never `apps/academorix-dashboard/config/.doppler.yaml`.
- **No template `.doppler.yaml` files.** When `pnpm bootstrap:*` scaffolds a new
  deployable, the script writes a fresh `.doppler.yaml` into the copied
  directory pointing at the new deployable's Doppler project.

## Enterprise-level docblock per file

Every `.doppler.yaml` opens with a docblock explaining:

- **Header** — one-line title naming the deployable's role.
- **What lives here** — the specific secret set this file binds (VITE\_\*,
  JWT_SIGNING_KEY, IDENTITY_SERVICE_URL, etc.).
- **What does NOT live here** — cross-reference to sibling files that own
  adjacent secrets (workspace-tooling secrets go to `/.doppler.yaml`).
- **Binding this workstation** — the `cd <dir> && doppler setup` invocation (or
  the `pnpm doppler:setup` one-shot).
- **Config branches** — one line each for `dev` / `stg` / `prd`.
- **Overriding at runtime** — example `DOPPLER_CONFIG=stg doppler run --`.
- **Governance** — anchors to this steering doc + ADR-0056.

Reviewers reject `.doppler.yaml` files that lack the docblock — the file is
readable in isolation only if it names its role.

## Provisioning a new deployable

When adding a new deployable app or service:

1. **Decide the workplace.** Academorix product code → academorix workplace.
   Figentra operator service or workspace-tooling → figentra workplace.
   Framework-tier tooling → figentra workplace (`figentra-workspace` already
   covers this; only add a new project if the tooling genuinely can't fit).

2. **Create the Doppler project.**
   - **Via MCP** (from an AI agent session): call the workplace-appropriate
     `mcp_doppler_<workplace>_projects_create` with `name: <slug>` and a short
     description (≤ 255 chars per Doppler's API limit).
   - **Via dashboard** (manual):
     https://dashboard.doppler.com/workplace/<workplace>/projects/new → name it
     `<slug>` → Doppler auto-creates `dev` / `stg` / `prd` root configs.

3. **Populate `dev` secrets.** Either paste them via the dashboard's Secrets UI
   OR use `mcp_doppler_<workplace>_secrets_update` for a bulk-import from an
   existing `.env` file.

4. **Write the `.doppler.yaml`** in the new deployable's directory with the
   canonical single-project shape + enterprise docblock (copy the shape from any
   existing per-deployable file).

5. **Bind this workstation.** From the workspace root:

   ```sh
   pnpm doppler:setup
   ```

   The script picks up the new `.doppler.yaml` automatically. If the new project
   lives in a different Doppler workplace than the CLI's current auth token,
   `doppler login` first to swap accounts, then re-run.

6. **Verify.** From the new deployable's dir:

   ```sh
   cd <new-dir>
   doppler run -- printenv DOPPLER_PROJECT
   # → prints the new project's slug
   ```

## Adding a new deployable — checklist

- [ ] Correct workplace chosen (academorix product vs figentra operator).
- [ ] Doppler project created via MCP or dashboard.
- [ ] `dev` config populated with at least `APP_NAME` (services) or the
      `<runtime>_APP_ENV` build-time constant (apps) so the deployable boots.
- [ ] `stg` + `prd` configs remain empty until staging / production environments
      are actually provisioned.
- [ ] `.doppler.yaml` written under the new deployable's directory with the
      enterprise docblock.
- [ ] `pnpm doppler:setup:dry` shows the new deployable in the plan;
      `pnpm doppler:setup` runs cleanly.
- [ ] Consuming CI / deploy pipeline gets its own Doppler service token scoped
      to `<project>/<config>` (never a personal token in CI).
- [ ] If the new deployable pushes either workplace over the plan cap (10
      projects), an ADR extends or supersedes ADR-0056 to document the trade-off
      (or the workplace is upgraded to a paid plan).

## Where secrets live

**Never** put a secret in more than one place. The taxonomy:

- **Workspace-tooling secrets** (Turbo cache, HeroUI Pro postinstall, Changesets
  release, npm publish, Sentry auth, GitLab/GitHub tokens, JIRA, OneUptime API
  key, Slack webhooks) → `figentra-workspace`. Consumed by root
  `doppler run -- pnpm turbo run <task>`.
- **Cross-service URLs + backend runtime secrets** (per-service Supabase
  connection, JWT signing key, R2/S3 bucket credentials, third-party API keys) →
  each service's own Doppler project. Cross-service URLs (`IDENTITY_SERVICE_URL`, `COMMERCE_SERVICE_URL`,
  ...) are duplicated per service that needs them — not shared via a common
  config.
- **Client-side public config** (`VITE_*`, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`) →
  each client app's own Doppler project. These are build-time constants inlined
  into the bundle; they're "secrets" in the Doppler sense (rotated via Doppler)
  but visible in the shipped bundle.
- **Client-side private config** (backend API tokens the mobile app uses to talk
  to the API) → each client app's own Doppler project. Injected at build time;
  hidden from the shipped bundle via environment-based build steps.

## Never do these

- **Never commit `.env` files with real values.** Only `.env.example`
  (placeholders) may be committed. `.env` is gitignored.
- **Never commit `.kiro/settings/mcp.json`** — carries Doppler MCP tokens.
  Gitignored per `commit-conventions.md` §Protected paths.
- **Never share one Doppler project between two deployables.** Each deployable's
  blast radius on a leaked token should equal exactly one deployable.
- **Never put a `figentra-*` project in the academorix workplace or an
  `academorix-*` project in the figentra workplace.** The two-workplace split
  reflects the brand boundary. Reviewers reject any drift.
- **Never author a `doppler.yaml` (no dot).** The workspace convention is
  uniform `.doppler.yaml` (dot). Any hit on `doppler.yaml` (no dot) is a
  review-blocking finding.
- **Never author a root `.doppler.yaml` with a multi-project `setup: []`
  array.** That's the retired PR-374 shape. `scripts/doppler-bind.mjs` actively
  rejects it with a clear parse error to prevent silent no-op bindings.
- **Never leave the `HEROUI_PERSONAL_TOKEN` value in per-deployable Doppler
  projects.** It belongs in `figentra-workspace` only. The MCP client's copy in
  `.kiro/settings/mcp.json` is separate (per-machine MCP config) and not managed
  by Doppler.

## MCP tokens — Doppler CLI vs MCP

Three Doppler auth surfaces exist on this workstation. They're different:

- **`doppler` CLI locally** — auth token stored under
  `~/.doppler/.doppler.yaml`. Managed via `doppler login` + `doppler logout`.
  Because the workspace uses two Doppler accounts, `doppler login` needs to be
  re-invoked to swap accounts when working across the boundary. NEVER run
  `doppler logout --scope $PWD --yes` from within the workspace — it revokes the
  CLI's auth token globally. To unbind a single directory's project / config
  binding without touching auth, use
  `doppler configure unset project --scope $PWD` +
  `doppler configure unset config --scope $PWD`.
- **`doppler-academorix` MCP** — Kiro workflow. Personal access token from the
  academorix Doppler account. Token stored in `.kiro/settings/mcp.json` under
  `mcpServers["doppler-academorix"].env.DOPPLER_TOKEN`.
- **`doppler-figentra` MCP** — Kiro workflow. Personal access token from the
  Figentra Technologies Doppler account. Token stored in
  `.kiro/settings/mcp.json` under
  `mcpServers["doppler-figentra"].env.DOPPLER_TOKEN`.

Managing MCP tokens: rotate on each Doppler dashboard → paste new value into
`mcp.json` → reload MCP (Cmd+Shift+P → "Kiro: Reload MCP Servers").

`.kiro/settings/mcp.json` is gitignored. Never commit token values.

If the CLI ever loses its auth token (accidental `doppler logout`), the personal
token from either MCP entry can be restored to the CLI without a re-login:

```sh
TOKEN=$(jq -r '.mcpServers["doppler-figentra"].env.DOPPLER_TOKEN' .kiro/settings/mcp.json)
doppler configure set token "$TOKEN" --scope / --silent
```

That restores the CLI's auth without echoing the token to the terminal. Swap
`doppler-figentra` → `doppler-academorix` when working on Academorix projects.

## Backup + restore playbook

If either workplace ever needs to be rebuilt (project rename, split, cap
upgrade), the safe flow is:

1. **Back up every project × config.** For each project, iterate configs and run
   `mcp_doppler_<workplace>_secrets_download(format: env)`. Write outputs to
   `.tmp/doppler-backup-YYYY-MM-DD/<project>/<config>.json` (or `.env`) with
   `chmod 600`. Zero secret values echoed to chat.
2. **Author a MANIFEST.md** in that folder documenting: source workplace ×
   project × config × secret count, restore-mapping table (which secrets go into
   which new project), dropped set (secrets that don't survive the rebuild +
   why).
3. **Delete + recreate** — via MCP `<workplace>_projects_delete` (destructive,
   irreversible) then `<workplace>_projects_create`. Delete parallel calls
   survive concurrent deletion up to ~10; parallel creates hit rate-limit at ~12
   (Doppler returns 409 Too many requests) — batch smaller.
4. **Restore** — for each new project × config, call
   `mcp_doppler_<workplace>_secrets_update` with the values from the backup
   file. Strip DOPPLER\_\* auto-generated keys before pushing.
5. **Verify** — a per-service `doppler secrets --project <slug>` on each
   dashboard should match the pre-nuke set minus the intentional drops. MCP
   `secrets_names` gives a quick spot-check.
6. **Retain the backup** for one release cycle, then
   `rm -rf .tmp/doppler-backup-YYYY-MM-DD` when confidence is high.

The 2026-07-27 nuke-and-rebuild of the Stackra workplace + the 2026-07-28
nuke-and-rebuild of the academorix workplace + the 2026-08-06 two-workplace
split all followed this playbook — backups live at
`.tmp/doppler-backup-2026-07-27/`, `.tmp/doppler-backup-academorix-2026-07-28/`,
and `.tmp/doppler-backup-2026-08-06/`.

### Doppler API quirks captured on 2026-08-06

- **Description length limit** is 255 characters. Longer descriptions fail with
  a validation error at `projects_create` time.
- **Parallel `projects_create` calls hit a 409 rate limit at ~12 concurrent** —
  the error message reads `Error 409 Too many requests`. Retry with a smaller
  batch (6 works reliably).
- **`secrets_update` accepts arbitrary keys via the `secrets` object.** The MCP
  schema hints at `ALGOLIA`/`DATABASE`/`STRIPE` — misleading, but
  `additionalProperties: true` means every key round-trips.
- **DOPPLER\_\* auto-markers** (`DOPPLER_CONFIG`, `DOPPLER_ENVIRONMENT`,
  `DOPPLER_PROJECT`) are auto-generated by Doppler. Strip them from pushes;
  they're read-only.

## Cross-references

- ADR-0056 —
  [`.docs/adr/0056-doppler-project-per-deployable-app.md`](../../.docs/adr/0056-doppler-project-per-deployable-app.md)
  is the decision record this steering codifies. See its **Amendment
  2026-08-06** section for the two-workplace split rationale.
- ADR-0032 —
  [`.docs/adr/0032-six-service-split.md`](../../.docs/adr/0032-six-service-split.md)
  — the service topology the `figentra-*` vs `academorix-*` naming reflects.
- ADR-0069 —
  [`.docs/adr/0069-corporate-operator-vendor-scope.md`](../../.docs/adr/0069-corporate-operator-vendor-scope.md)
  — the three-vendor-scope model (`stackra/*` framework, `figentra/*` operator,
  `academorix/*` product) that the two-workplace split mirrors.
- Brand hierarchy — [`.kiro/steering/brand-hierarchy.md`](brand-hierarchy.md) —
  the Figentra / Stackra / Academorix boundary rules.
- Commit conventions —
  [`.kiro/steering/commit-conventions.md`](commit-conventions.md) § Protected
  paths — never commit `.env` files, `.kiro/settings/mcp.json`, or `secrets/**`.
- Temp files — [`.kiro/steering/tmp-files.md`](tmp-files.md) — the `.tmp/`
  backup convention.
- Shell commands — [`.kiro/steering/shell-commands.md`](shell-commands.md) —
  never `for` / `while` loops in tool-invoked commands (fan-out via `xargs` or
  parallel tool calls instead).
- Onboarding script — `scripts/doppler-bind.mjs` (wired as `pnpm doppler:setup`)
  — walks every `.doppler.yaml` and binds each directory to its project/config
  on the current workstation.
