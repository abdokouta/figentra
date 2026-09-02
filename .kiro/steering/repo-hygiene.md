---
authored_by: kiro
authored_at: 2026-08-14
source: prompt://repo-hygiene-steering
reviewed_by: null
reviewed_at: null
---

# Repo hygiene — audit, sync, prune

Every agent that touches multiple workspace repos in one session — sub-agent
fan-out, cross-package refactors, close-out sweeps — MUST know about these three
scripts. They codify the read-only-audit + safe-sync + safe-prune workflow the
workspace uses to keep 138+ cloned repos consistent.

Read alongside:

- [`ai-agent-governance.md`](ai-agent-governance.md) — every write to `main` is
  MUST-escalate. These scripts observe that rule (audit is MAY, execute paths
  are MUST-escalate).
- [`env-naming.md`](env-naming.md) §Rule 6 — Doppler-remap pipe every script
  runs under.
- [`shell-commands.md`](shell-commands.md) — sibling guardrail for tool-invoked
  shell.

## The three scripts

Every one runs under
`doppler run --scope . -- ./scripts/remap-secrets.sh node scripts/<name>.mjs` so
the Layer 1 canonical env vars (`STACKRA_GITLAB_TOKEN`, ...) land in the child
process. Never invoke without the doppler wrapper — bare `node scripts/…` misses
the token.

### 1. `scripts/audit-repos.mjs` — read-only audit (MAY)

Walks every git repo under `~/dev/{figentra-inc,academorix,stackra}/**` + hits
GitLab for the workspace-registered subset. Emits a markdown report at
`.kiro/reports/YYYY-MM-DD-repos-audit.md`.

What it surfaces per repo:

- **LOCAL** — dirty working trees, stashes, detached HEADs, unpushed commits,
  orphan local branches (no upstream), local branches merged into default.
- **REMOTE (via GitLab API)** — open MRs, stale remote feature branches (merged
  into main + safe to delete), unsynced tracking branches (develop/staging vs
  main, with `+N` ahead-count).

Safe to run any session. Zero writes. Consumer picks which findings to act on +
runs the corresponding action script.

```bash
# Full audit — writes .kiro/reports/YYYY-MM-DD-repos-audit.md
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/audit-repos.mjs

# Subset of repos (comma-separated substring against clone path).
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/audit-repos.mjs --only stackra/backend/auth,stackra/frontend

# Local-only pass (skip GitLab API — fast fallback when token revoked).
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/audit-repos.mjs --skip-remote
```

### 2. `scripts/sync-branches.mjs` — fast-forward tracker branches (MUST-escalate on `--execute`)

Fast-forwards each project's `develop` + `staging` tracker branches to the
source ref (default `main`). Zero merges, zero force-pushes — target branches
MUST be strict ancestors of source or they're skipped with a warning.

Use after a `main` merge to keep tracker branches aligned. Use only when the
audit's "Unsynced tracking branches" section shows `+0` (strict ancestor) rows.

```bash
# Dry-run — print the plan without touching anything.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/sync-branches.mjs --dry-run

# Execute — MUST-escalate; requires operator's explicit "yes" per session.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/sync-branches.mjs --execute

# Subset only.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/sync-branches.mjs --execute \
    --only figentra-inc/workspace,academorix/backend/ai
```

Behaviour per (repo, target):

- Target = source SHA → skip (already synced).
- Target NOT ancestor of source (`+N` where N > 0) → skip with warning
  (diverged; needs a proper MR).
- Target IS protected → skip with warning (can't delete+recreate).
- Otherwise → delete + recreate branch at source SHA.

### 3. `scripts/prune-stale-branches.mjs` — delete merged remote feature branches (MUST-escalate on `--execute`)

Deletes remote feature branches on GitLab that pass 4 filters:

1. GitLab reports `branch.merged === true`
2. NOT the default branch
3. NOT protected
4. Name NOT in `TRACKER_SET` = `{develop, staging, master, main}` — extra
   workspace-side safety in case a tracker is accidentally unprotected.

Every deletion is recoverable via `git push origin <sha>:<branch>` within
GitLab's ~30-day reflog window.

```bash
# Dry-run — print candidates + filter checks.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/prune-stale-branches.mjs --dry-run

# Execute — MUST-escalate.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/prune-stale-branches.mjs --execute

# Subset only.
doppler run --scope . -- ./scripts/remap-secrets.sh \
  node scripts/prune-stale-branches.mjs --execute \
    --only figentra-inc/backend/identity,academorix/frontend
```

## Canonical workflow — audit → decide → act

Every workspace-repo cleanup follows this shape. Skip steps that don't apply to
your session.

```
1. AUDIT (MAY — safe any time)
   $ node scripts/audit-repos.mjs
   → .kiro/reports/YYYY-MM-DD-repos-audit.md

2. PER-REPO LOCAL TRIAGE (operator-only, per repo)
   - Stashes:            git stash pop | drop | branch
   - Dirty trees:        git add + commit  OR  git checkout .
   - Detached HEADs:     git checkout <branch>
   - Unpushed commits:   git push  OR  git reset --hard @{u}
   - Orphan branches:    git push -u origin <br>  OR  git branch -d <br>
   - Merged local:       git branch -d <branch>

3. OPEN MRs (MUST-escalate — never autonomous)
   Operator inspects each MR in the GitLab UI + decides merge OR close.
   Every merge to main requires reviewer sign-off per governance.

4. PRUNE STALE REMOTE BRANCHES (MUST-escalate on --execute)
   $ node scripts/prune-stale-branches.mjs --dry-run   # preview
   $ node scripts/prune-stale-branches.mjs --execute   # after op "yes"

5. FAST-FORWARD TRACKER BRANCHES (MUST-escalate on --execute)
   Only for +0 rows in the audit. +N rows need a proper MR.
   $ node scripts/sync-branches.mjs --dry-run
   $ node scripts/sync-branches.mjs --execute

6. RE-AUDIT
   $ node scripts/audit-repos.mjs
   → confirm zero findings you didn't intentionally leave open
```

## Governance envelope

Every MUST-escalate action (steps 3, 4, 5) needs the operator's explicit "yes"
per session per [`ai-agent-governance.md`](ai-agent-governance.md). Every commit
that lands via these scripts on `main` carries the standard override footer:

```
provenance: authored_by=kiro; source=prompt://<slug>
override: agents-may-override=main-branch-write; reason="operator authorised via '<verbatim ask>'"
```

## When to reach for which

| Need                                                 | Script                               |
| ---------------------------------------------------- | ------------------------------------ |
| "What's the state of every workspace repo?"          | `audit-repos.mjs`                    |
| "Fast-forward develop/staging after a main merge"    | `sync-branches.mjs --execute`        |
| "Clean up merged feature branches across every repo" | `prune-stale-branches.mjs --execute` |
| "Only inspect ONE repo"                              | `audit-repos.mjs --only <path>`      |
| "GitLab token is down — offline audit"               | `audit-repos.mjs --skip-remote`      |

Never reach for these scripts INSTEAD of proper per-repo git hygiene — they're
for the CROSS-REPO fan-out shape. In-repo cleanup still uses plain `git` per
repo.

## Extending

Adding a new fan-out script that hits GitLab across every workspace repo lands
under `scripts/`, uses `_lib/repos.mjs`'s `WORKSPACE_REPOS` inventory, and
follows the same `--dry-run`/`--execute` gate. Register it in this steering
doc's §"The three scripts" section so future agents discover it. Reviewers
reject fan-out scripts that skip the dry-run gate.

## Related

- [`ai-agent-governance.md`](ai-agent-governance.md) — MAY vs MUST-escalate
  rules the `--execute` gate observes.
- [`env-naming.md`](env-naming.md) §Rule 6 — Doppler → env-var pipe.
- [`shell-commands.md`](shell-commands.md) — sibling guardrail.
- [`commit-conventions.md`](commit-conventions.md) §Provenance — the
  provenance + override footer every autonomous commit carries.
- `scripts/audit-repos.mjs` — the audit generator.
- `scripts/sync-branches.mjs` — the tracker-sync action.
- `scripts/prune-stale-branches.mjs` — the merged-branch pruner.
- `scripts/_lib/repos.mjs` — the canonical repo inventory these scripts read.
- `scripts/_lib/gitlab.mjs` — the GitLab API v4 wrapper.
