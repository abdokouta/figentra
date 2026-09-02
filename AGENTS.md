# AGENTS.md — universal AI-agent entry point

> **You are an AI agent.** Read this file first. Everything you need to be
> productive in this workspace routes from here.

This file is the entry point for **every AI agent** that opens this workspace —
Kiro, Claude Code, Cursor, aider, and anything else that respects the
convention. Humans read `README.md`; agents read this.

## Workspace identity

- **Repo:** `figentra-inc/workspace` on GitLab
- **Role:** cross-repo tooling substrate for the Figentra product line
- **Contains:** dev scripts + AI-agent config (`.kiro/`) + workspace CLI
  (`tools/cli/`) + workspace docs (`.docs/`)
- **Does NOT contain:** product code, service code, framework packages — those
  live in the split repos under `stackra/*`, `figentra-inc/backend/*`, and
  `academorix/*`. See [`README.md`](README.md) §"Repos" for the full map.

## The four surfaces

Every artefact in this workspace belongs to exactly one:

| Surface         | Location                                                                             | What it does                                          |
| --------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Entry**       | `AGENTS.md`, `CLAUDE.md`, `AGENT_ROSTER.md`, `.kiro/BOOT.md`                         | Bootstrap kit — routes agents to the right specialist |
| **Rules**       | `.kiro/steering/`                                                                    | 59 steering docs the agent must follow (scope-gated)  |
| **Specialists** | `.kiro/agents/`                                                                      | 56 specialised sub-agent charters                     |
| **Operations**  | `.docs/runbooks/`, `.docs/runbooks/`, `.kiro/plans/`, `.kiro/reports/`, `.docs/adr/` | Time-ordered artefacts describing action + decisions  |

## First 5 files to read

Every session reads these in order before any tool call:

1. **This file (`AGENTS.md`)** — you're doing it.
2. **[`.kiro/BOOT.md`](.kiro/BOOT.md)** — the ≤2k-token orientation kit + link
   table.
3. **[`AGENT_ROSTER.md`](AGENT_ROSTER.md)** — one-liner index of every
   specialist agent.
4. **[`.kiro/agents/ROUTING.md`](.kiro/agents/ROUTING.md)** — task-class → agent
   decision tree.
5. **[`.kiro/steering/INDEX.md`](.kiro/steering/INDEX.md)** — steering doc
   classifier (which rules apply when).

After those, the specific steering docs + agent charters relevant to your task
load on demand. Do NOT read all 59 steering docs and all 56 agent charters at
boot — that's a ~40k-token orientation and defeats the purpose of the index.

## Task routing — the 3-question hop

For any new ask, walk this decision tree:

1. **Is this a workspace change or a split-repo change?**
   - Workspace change → work here, commit to `figentra-inc/workspace`.
   - Split-repo change → open the target repo (see `README.md` §"Repos"), work
     there. Use `scripts/dev/backend.mjs` or `scripts/dev/frontend.mjs` to clone
     into `~/dev/stackra*` if not already present.

2. **Which lane does the change belong to?** Consult
   [`.kiro/agents/ROUTING.md`](.kiro/agents/ROUTING.md). The router maps common
   task classes to the owning specialist agent. Example: _"add a new
   `@stackra/*` framework package"_ → `framework-core-builder`.

3. **Which steering docs govern this file / directory?** Consult
   [`.kiro/steering/INDEX.md`](.kiro/steering/INDEX.md). Rules are scope-gated —
   an edit in a backend service loads different steering than an edit in the
   frontend framework.

## Environment expectations

- **Node 24** — pinned in `.nvmrc`. Every script in `scripts/*.mjs` requires
  native `fetch`, `styleText`, JSDoc-typed ES modules.
- **pnpm 12+** — package manager for every repository context.
- **Go 1.23+ / Python 3.12+** — the only non-TypeScript backend languages (Go
  for performance-critical services + Terraform providers; Python for the AI
  service). Every other backend is TypeScript on Cloudflare Workers.
- **Doppler CLI** — for secrets across every deployable. See
  [`.kiro/steering/doppler.md`](.kiro/steering/doppler.md).

## Secrets + MCP servers

**One secret substrate** — Doppler (per ADR-0085 §Rule 6, revised 2026-08-09):

- **Layer 1 (workspace tooling)** — Doppler project `figentra-workspace/dev`.
  Bind once via
  `doppler setup --project figentra-workspace --config dev --scope /path/to/workspace`.
  Every `.mjs`/`terraform`/`curl` invocation runs as
  `doppler run --scope . -- ./scripts/remap-secrets.sh <cmd>` — the Doppler CLI
  injects every Layer 1 canonical `<BRAND>_<VENDOR>_<RESOURCE>` name; the remap
  script aliases vendor-standard names (`GITLAB_TOKEN`, `AWS_ACCESS_KEY_ID`,
  `CLOUDFLARE_API_TOKEN`, `TF_VAR_*`, ...).
- **Layer 2 (per-deployable)** — Doppler project `<deployable>/<env>` (e.g.
  `figentra-identity/prd`, `academorix-mobile/stg`). Consumed at runtime by the
  Cloudflare Worker / Vite build / Expo build — terraform-provisioned via the
  `cloudflare-worker` + `cloudflare-pages` modules.
- **CI runtime** — GitLab CI variable `DOPPLER_TOKEN` (env-scoped per
  `development` / `staging` / `production`), provisioned by
  `terraform/envs/gitlab-ci-secrets/`. CI jobs run `doppler run -- <cmd>`
  identically to workstations.

**Retired 2026-08-09** (do NOT resurrect): `.tmp/secrets/secrets.txt`,
`scripts/secrets-from-doppler.sh`, `scripts/_lib/secrets.mjs`.

**MCP servers** — the canonical portable config lives at
[`.mcp.json`](.mcp.json) at repo root. Every secret in that file is a `${VAR}`
placeholder so the file itself is safe to commit — no literal tokens.
Kiro-specific extensions live in `.kiro/settings/mcp.json` (gitignored —
contains live tokens).

**MCP servers configured** (as of this repo's `.mcp.json`):

| Server              | Purpose                                | Env var(s) required                  |
| ------------------- | -------------------------------------- | ------------------------------------ |
| `doppler`           | Doppler API access                     | `DOPPLER_TOKEN`                      |
| `heroui-react`      | HeroUI OSS + Pro React component docs  | (none — public)                      |
| `heroui-native`     | HeroUI Native component docs           | (none — public)                      |
| `heroui-pro`        | HeroUI Pro React (private tokens API)  | `HEROUI_PRO_TOKEN`                   |
| `heroui-native-pro` | HeroUI Native Pro (private tokens API) | `HEROUI_PRO_TOKEN`                   |
| `sentry`            | Sentry issue + event query             | `SENTRY_MCP_TOKEN`                   |

**Populating the env vars** — two paths, pick per workstation:

1. **Doppler binding** (recommended). Bind the workspace-level Doppler config:
   `doppler setup --project figentra-workspace --config dev --scope /path/to/workspace`.
   Then start your agent with
   `doppler run --scope /path/to/workspace -- <agent-command>`; env vars land in
   the process automatically.
2. **Direct shell export.** `export DOPPLER_TOKEN=...`, etc. in your shell rc
   file. Every agent invocation inherits from the parent shell.

**Never** commit literal tokens to `.mcp.json`. If you need to override for a
laptop-only session, use the Kiro-specific `.kiro/settings/mcp.json` (which is
gitignored) — never edit `.mcp.json` with a live secret.

## Cross-repo fan-out — audit + sync + prune

Sessions that touch multiple workspace repos in one shot (sub-agent fan-out,
close-out sweeps, cross-package refactors) MUST use the three fan-out scripts
codified by [`.kiro/steering/repo-hygiene.md`](.kiro/steering/repo-hygiene.md):

- **`scripts/audit-repos.mjs`** — read-only audit across every git repo under
  `~/dev/{figentra-inc,academorix,stackra}/**` + GitLab side. Safe MAY action.
- **`scripts/sync-branches.mjs`** — fast-forward `develop`/`staging` trackers to
  `main`. `--execute` is MUST-escalate.
- **`scripts/prune-stale-branches.mjs`** — delete remote feature branches merged
  into main. `--execute` is MUST-escalate.

Every one runs under
`doppler run --scope . -- ./scripts/remap-secrets.sh node scripts/<name>.mjs`.

## Governance — MAY vs MUST-escalate

Full rules:
[`.kiro/steering/ai-agent-governance.md`](.kiro/steering/ai-agent-governance.md).

**MAY (autonomous):**

- Author docs, plans, reports, ADR drafts, tests, refactors.
- Push commits to feature branches.
- Consolidate duplicates, delete fossils, update indexes.

**MUST escalate to a human:**

- Merge to `main` in any repo.
- Production deploys (Cloudflare Workers via `wrangler` + `terraform apply`).
- Destructive ops (mass delete, force-push, permanent-remove).
- Cross-service contract changes.
- Rotating any secret (Doppler, GitLab, Cloud API tokens).
- Grants + permissions changes.

## Session-start checklist

Before your first tool call, confirm you can answer:

- [ ] What repo am I in? (`figentra-inc/workspace` unless my task is a split
      repo)
- [ ] Which agent owns this task? (consulted `AGENT_ROSTER.md` + `ROUTING.md`)
- [ ] Which steering docs apply to the files I'll touch? (consulted `INDEX.md`)
- [ ] Are there any active plans in `.kiro/plans/` this task is part of?
- [ ] Where does my output land? (`.kiro/reports/` for audits, `.kiro/plans/`
      for plans, regular source for code)

## Cross-references

- Root [`README.md`](README.md) — human-oriented overview + repo map.
- [`AGENT_ROSTER.md`](AGENT_ROSTER.md) — 56-charter index.
- [`.kiro/BOOT.md`](.kiro/BOOT.md) — session-start orientation.
- [`.kiro/agents/ROUTING.md`](.kiro/agents/ROUTING.md) — task-class → agent map.
- [`.kiro/agents/INDEX.md`](.kiro/agents/INDEX.md) — agents grouped by lane.
- [`.kiro/steering/INDEX.md`](.kiro/steering/INDEX.md) — steering rules
  classifier.
- [`.docs/runbooks/README.md`](.docs/runbooks/README.md) — operator runbooks.
- [`.docs/adr/`](.docs/adr/) — 60 architectural decisions.
- [`.kiro/plans/2026-08-03-ai-agent-first-workspace.md`](.kiro/plans/2026-08-03-ai-agent-first-workspace.md)
  — the plan this file implements.

## What NOT to do

- Do NOT read every steering doc at boot (~40k tokens; defeats the index).
- Do NOT bypass the ROUTING.md and pick an agent from title alone.
- Do NOT modify a split-repo file from this workspace — clone the target repo
  (or use `scripts/dev-*.mjs`) and work there.
- Do NOT commit secrets. `.kiro/settings/mcp.json` is gitignored for a reason.
  Never resurrect `.tmp/secrets/secrets.txt` — the pattern was retired
  2026-08-09 per ADR-0085 §Rule 6.
- Do NOT invoke a sub-agent for a task another sub-agent already owns — work
  stays in one lane per session unless the ROUTING.md says otherwise.


## Deployment manifests and infrastructure generation

- Every deployable under `apps/*`, `workers/*`, and `services/*` MUST have a
  `cloud.yaml`.
- `cloud.yaml` is metadata only; secrets are forbidden.
- Every deployable gets a Terraform ownership boundary under
  `infrastructure/terraform/deployables/<slug>/` with `main.tf`, `variables.tf`,
  and `versions.tf`.
- Shared Terraform resources remain in `infrastructure/terraform/modules`.
- Docker Compose is generated from `cloud.yaml`; do not hand-edit generated
  compose output.
- Nest services use `@nestjs/microservices` as a transport abstraction. Raw TCP
  is not the default Figentra transport. NATS is the default internal broker.
- Service-to-service calls must use typed contracts and service identity.
- All new source/config/infrastructure files must contain meaningful docblocks
  or comments explaining purpose and non-obvious decisions. Avoid comments that
  merely restate code.
