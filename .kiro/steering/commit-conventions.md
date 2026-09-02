# Commit conventions

Rules for how every commit against `stackra-frontend` is authored + verified.

> **ADR anchor.** Codified by
> [ADR-0054](../../docs/adr/0054-git-commit-conventions.md). The shape rules
> below extend the Conventional Commits baseline enforced by
> [`commitlint.config.mjs`](../../commitlint.config.mjs) with (a) an
> emoji-in-subject convention, (b) a `--no-verify` allowlist, (c) per-writer +
> per-wave granularity, and (d) multi-domain split rules for cross-package work.

Read alongside:

- [`.kiro/steering/conventions.md`](conventions.md) §Git — the four-bullet
  baseline.
- [`AGENTS.md`](../../AGENTS.md) §Git — the AI-agent-facing companion.
- [`commitlint.config.mjs`](../../commitlint.config.mjs) — the message-shape
  enforcement layer (unchanged by this steering).

## Rule 1 — commit message shape

Every commit header matches:

```
<type>(<scope>): <emoji> <subject>
```

Where:

- **`<type>`** — one of the 13 enum members in `commitlint.config.mjs`: `feat`,
  `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `build`, `ci`, `chore`,
  `docs`, `deps`, `release`.
- **`<scope>`** — kebab-case, optional. Typically the package slug (`rbac`,
  `dashboard`, `kbd`) or a workspace-wide concern (`pnpm`, `tsup`, `changeset`,
  `ci`). Omit the parens when there's no scope: `chore: 🔧 update prettier`.
- **`<emoji>`** — one of the emoji from Rule 2 below. Required for new commits
  authored on or after 2026-07-26; grandfathered for older commits.
- **`<subject>`** — imperative mood, lowercase first letter (after the emoji),
  no trailing period, ≤ 100 chars total header length.

Body + footer inherit `commitlint.config.mjs` rules (blank leading line, ≤
200-char body / footer lines).

**Example headers:**

```
feat(rbac): ✨ add role editor form
fix(dashboard): 🐛 stop wildcard re-export from contracts
docs(adr): 📝 land ADR-0053 version/maturity reconcile
refactor(kbd): ♻️ rebuild palette-theme-switcher on radio-group
perf(events): ⚡ narrow useOnEvent payload generic
test(support): ✅ cover manager + multiple-instance-manager
chore(pnpm): 🔧 add minimumReleaseAge 7-day guard
build(tsup): 🔨 add sub_domains catalog field
ci: 👷 add size-limit workflow
revert(ui): ⏪ revert token migration on inline-tip
style: 🎨 apply prettier to committed files
deps(catalog): 📦 add heroui-native to workspace catalog
release: 🎉 bump 11 v1+ packages alpha → beta
```

## Rule 2 — emoji table

One emoji per Conventional Commits type. The emoji is a visual anchor, not the
primary signal (the type prefix is).

| Type       | Emoji | Use case                                                 |
| ---------- | ----- | -------------------------------------------------------- |
| `feat`     | ✨    | New feature or capability                                |
| `fix`      | 🐛    | Bug fix                                                  |
| `docs`     | 📝    | Documentation-only changes                               |
| `refactor` | ♻️    | Restructuring without changing behavior                  |
| `perf`     | ⚡    | Performance improvement                                  |
| `test`     | ✅    | Adding, fixing, or restructuring tests                   |
| `build`    | 🔨    | Build system / bundler / tsup / tsconfig                 |
| `ci`       | 👷    | CI/CD pipeline changes                                   |
| `chore`    | 🔧    | Tooling, config, non-source housekeeping                 |
| `revert`   | ⏪    | Revert of an earlier commit                              |
| `style`    | 🎨    | Formatting, whitespace, lint-only (no code change)       |
| `deps`     | 📦    | Dependency updates (npm overrides, package.json versions) |
| `release`  | 🎉    | Version bumps + changeset consumption                    |

**Two cross-cutting emoji layered on top:**

- **🔒 security** — append to the subject when the commit closes a security
  concern (`fix(auth): 🔒 rotate signing key on refresh`). CVE or
  security-report anchor recommended in the body.
- **💥 breaking** — required in the subject when the type carries a `!` suffix
  (`feat(kbd)!: 💥 delete WebKbdModule pass-through`). Also requires a
  `BREAKING CHANGE:` line in the body per Conventional Commits.

## Rule 3 — granularity

Every commit is **one logical change**. Split rules:

1. **Split refactors from feature work.** A `feat` commit adds behavior; a
   `refactor` commit changes shape without behavior. Never both in one commit —
   reviewers can't tell them apart.

2. **Per-writer for agent-authored waves.** A remediation wave that fires N
   writer sub-agents ships N commits — one per writer. The
   `frontend-final-production-review-remediation` Wave 3 pattern:
   `framework-core-builder` + `vitest-test-engineer` + `heroui-ui-builder` =
   three commits. Each commit is cherry-pick-revertible.

3. **Per-wave when writers overlap.** Small waves where one writer authors
   everything ship as a single commit named after the wave
   (`refactor(wave-1): ♻️ delete CROSS-001 contracts wildcard`).

4. **Never mix two top-level workspace domains** in one commit:
   - `frontend/packages/**`
   - `backend/packages/**`
   - `~~packages/sdk/**~~ (retired 2026-08)`
   - `services/**`
   - `templates/**`
   - `docs/**`
   - `.kiro/**` (governance — steering, reports, specs, agents)

   Root files (`README.md`, `package.json`, `package.json workspaces`,
   `.size-limit.json`, `.changeset/**`) commit with the domain they most affect.
   A `.changeset/wave-1-*.md` commits with the wave's writer commits; a root
   README package-count fix commits standalone under `docs: 📝 …`.

5. **The report + the fix commit together.** Each writer's wave report under
   `.kiro/reports/**` commits WITH the writer's source changes, not standalone.
   Reviewers reading the commit see both the WHAT (source) and the WHY (report).

## Rule 4 — protected paths (never commit)

Every commit MUST NOT stage:

- `.kiro/settings/mcp.json` — contains MCP tokens per `AGENTS.md`.
- `.doppler.yaml` — Doppler service binding.
- `.env`, `.env.*` (except `.env.docker.example`, which IS committed) — local
  secrets.
- `secrets/**` — any secret store.
- `.tmp/**` — session scratch space per
  [`.kiro/steering/tmp-files.md`](tmp-files.md).
- `.turbo/`, `dist/`, `node_modules/`, `build/`, `.next/` — build artefacts
  (already `.gitignore`d).
- Any file matching `*.pem`, `*.key`, `id_rsa*`, `id_ed25519*` — key material.

## Rule 5 — staging discipline

- **Always run `git status --short` before staging.** Confirm scope.
- **Prefer specific files or scoped globs** over `git add .` or `git add -A`:
  - `git add frontend/packages/rbac/` — one package
  - `git add frontend/packages/*/catalog.json` — one file per package
  - `git add frontend/packages/dashboard/src/core/index.ts` — one file
- **`git add -u`** (stage tracked modifications only) is allowed when you've
  verified via `git status --short` that untracked additions should stay
  untracked.
- **Never `git add -A .`** without a preceding `git status --short` review that
  confirms every untracked file is intentional.

## Rule 6 — pre-commit verification tiers

Every commit passes THREE gates before landing on any branch:

**Tier 1 — always runs (via hooks):**

- `commit-msg` hook — `pnpm commitlint --edit "$1"` — validates message shape
  against `commitlint.config.mjs`.
- `pre-commit` hook — `pnpm lint-staged` — runs prettier + eslint on staged
  files only.

**Tier 2 — writer-owned (before staging):**

- `pnpm -F <package> typecheck` — the package the writer edited.
- `pnpm -F <package> build` — same.
- `pnpm -F <package> test` — same.

**Tier 3 — wave-level (before the first commit of a multi-writer wave):**

- `pnpm -w typecheck` — workspace-wide (Turbo caches make this fast).
- `pnpm -w build` — workspace-wide.
- `pnpm -w lint` — workspace-wide.
- `pnpm -w test` — workspace-wide.

Wave-level verification is the gate BEFORE any writer commits — it proves the
cross-package graph still links. Once wave-level is green, each writer's commits
inside that wave are safe by construction.

## Rule 7 — `--no-verify` policy

**Default: `--no-verify` is FORBIDDEN.** Every commit runs both hooks
(`commit-msg` + `pre-commit`).

**Allowed cases — each requires a `no-verify: <reason>` line in the commit
body:**

1. **Agent-authored bulk-migration commits** where wave-level verification (Tier
   3 in Rule 6) has already passed green. The per-commit `lint-staged` would run
   linters on 700+ files and timeout the terminal.

   Body line:
   `no-verify: bulk-migration; wave-level pnpm -w typecheck+build+lint+test green at HEAD~<N>`.

2. **Revert commits.** `git revert` re-applies the reverted commit's inverse;
   the original commit already passed hooks. Re-running lint-staged on the
   revert is redundant.

   Body line: `no-verify: revert of <sha>`.

3. **Merge commits.** Hooks run on the merge parents; the merge commit itself is
   metadata.

   Body line: `no-verify: merge commit`.

4. **Hotfix commits** under an on-call human's explicit approval in an incident
   channel.

   Body line: `no-verify: hotfix INC-<number>, on-call approved by <handle>`.

Every other case fires the hooks. Silent `--no-verify` (no body line explaining
why) is a P2 finding at review.

## Rule 8 — branch strategy

- **Never commit directly to `main` or `master`.** Every commit lands on a
  feature branch that opens a PR.
- **Feature branch naming:** `feat/<scope>-<short-desc>` per `conventions.md`
  §Git. Alternatives: `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`.
- **Agent-authored waves:** the AI supervisor branches off `main` as
  `remediation/<slug>` or `wave/<slug>` BEFORE writers fire. Every writer's
  commits land on that branch; the branch merges into `main` as a squash OR
  merge commit at wave close.
- **Never push `main` from an agent session.** Agent-authored commits live on a
  feature branch until a human opens the PR.

## Rule 9 — `--amend`, `revert`, `--force`

- **Prefer new commits over `--amend`.** Amending rewrites history; a new commit
  adds to it. `--amend` is allowed only when incorporating pre-commit hook
  changes from the previous commit (the hook amends its own commit
  legitimately).
- **`git revert` over `git reset --hard`.** Revert is auditable + safe on shared
  branches. `reset --hard` destroys history + local work; never run on a shared
  branch.
- **`git push --force` is forbidden by default.** Allowed only with the user's
  explicit ask in the same session, and only on a feature branch that never
  landed a shared PR. Never on `main`.
- **`git clean -fd` / `git branch -D`** — destructive. Never without the user's
  explicit ask.

## Rule 10 — commit signing (optional)

The workspace does not require GPG-signed commits. Contributors may sign with
`git commit -S` per their own preference. The pre-commit hook does not enforce
signing.

## Enforcement

Zero-hit greps that must pass on `git log <base>..HEAD`:

- **Missing emoji on post-2026-07-26 commits** — grep the header for a
  Conventional Commits prefix WITHOUT an emoji following the colon. P3 finding —
  encourages without blocking.
- **Silent `--no-verify`** — commits where the pre-commit hook would have failed
  but the body lacks a `no-verify:` line. Detected via
  `git log --grep="no-verify:" --invert-grep` filtered against the wave's
  expected-hooks-passing set. P2 finding.
- **Multi-domain mixing** — a commit's file list contains BOTH
  `frontend/packages/` AND `backend/packages/`. P1 finding.
- **Protected paths staged** — commit diff contains `.kiro/settings/mcp.json`,
  `.doppler.yaml`, `.env` files (except `.env.docker.example`), or `secrets/**`.
  P0 finding.

The `frontend-package-auditor` runs these greps as part of its Section-14
walk-through on every wave-close audit.

## Anti-patterns

| Anti-pattern                                        | Fix                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Fix things.`                                       | `fix(rbac): 🐛 correct role-detail-page permission gate`                             |
| `feat: added rbac module.`                          | `feat(rbac): ✨ add role admin module` (imperative + lowercase + no trailing period) |
| Emoji at the start of the header                    | Emoji goes AFTER the scope colon per Rule 1                                          |
| One commit touching frontend + backend              | Split by top-level domain per Rule 3.4                                               |
| `git commit -A -m "wip"`                            | `git status --short`, then `git add <specific>`, then meaningful message             |
| `git commit --no-verify -m "…"` with no body reason | Add `no-verify: <reason>` line per Rule 7                                            |
| `git push origin main`                              | Push to a feature branch, open a PR                                                  |
| `.env`, `.kiro/settings/mcp.json`, secrets staged   | Protected paths per Rule 4                                                           |
| Emoji from outside the table (`🚀`, `✏️`, `💡`)     | Use the 13 canonical + 2 cross-cutting emoji per Rule 2                              |
| Multiple logical changes in one commit              | Split into one commit per concern                                                    |

## When you're tempted

- **"It's just a one-line fix, do I really need an emoji?"** For commits after
  2026-07-26 — yes. It's four keystrokes. The wave-scanning benefit is
  workspace-wide; consistency compounds.
- **"I want to skip the hook because it's slow."** The commit-msg hook is ~1
  second. If the pre-commit hook is slow on a large staged set, that's case 1 in
  Rule 7 — allowed with a body line.
- **"I already ran `pnpm -w test` locally, why does the hook re-run linting?"**
  The hook checks the STAGED files' formatting, not the tests. Different gate.
  Both matter.
- **"I mixed frontend + backend in one commit because they're related."** Split.
  Reviewers own one vertical; one owner per commit is a productivity rule, not a
  purity rule.

## Provenance

Every commit landing an **agent-authored artefact** under `.kiro/plans/`,
`.kiro/reports/`, `.docs/adr/`, `.docs/runbooks/`, or `.kiro/steering/` carries
the provenance frontmatter on the file itself. The commit body does two
additional things:

1. **Cites the artefact's provenance block** in one line so the commit is
   scannable without opening the file:

   ```
   provenance: authored_by=kiro; source=prompt://ai-agent-first-workspace-plan
   ```

2. **Cites the `agents-may-override` OR `break-glass` marker** when the commit
   lands a MUST-escalate action per
   [`ai-agent-governance.md`](ai-agent-governance.md) §Overrides:

   ```
   override: agents-may-override=main-branch-write; reason="typo fix, human authorised in transcript"
   ```

Full spec:

- Frontmatter shape + field semantics —
  [`provenance-frontmatter.md`](provenance-frontmatter.md).
- MAY vs MUST-escalate rules —
  [`ai-agent-governance.md`](ai-agent-governance.md).

Reviewers reject:

- An agent-authored artefact committed without the provenance frontmatter on the
  file OR without the `provenance:` body line on the commit.
- A commit landing a MUST-escalate action without an `override:` body line
  citing the authorising marker.

Human-authored commits do not need a `provenance:` line — git blame + the commit
author already suffice.

## Cross-references

- ADR-0054 — this steering doc's decision record.
- Config: [`commitlint.config.mjs`](../../commitlint.config.mjs) — the
  message-shape enforcement layer (referenced when the workspace or its split
  repos ship one; the AI-agent-first workspace tolerates its absence).
- Steering: [`.kiro/steering/conventions.md`](conventions.md) §Git — the
  baseline this file extends.
- Steering: [`.kiro/steering/shell-commands.md`](shell-commands.md) — sibling
  guardrail on agent-invoked shell commands.
- Steering: [`.kiro/steering/tmp-files.md`](tmp-files.md) — protected `.tmp/`
  path.
- Steering: [`.kiro/steering/ai-agent-governance.md`](ai-agent-governance.md) —
  MAY vs MUST-escalate rules that gate every agent-authored commit.
- Steering:
  [`.kiro/steering/provenance-frontmatter.md`](provenance-frontmatter.md) — the
  sibling authoring rule for agent-authored artefacts.
- [`AGENTS.md`](../../AGENTS.md) §Git — the AI-agent-facing companion.
- Report:
  [`.kiro/reports/frontend-package-auditor/2026-07-25-wave-3-close.md`](../reports/frontend-package-auditor/2026-07-25-wave-3-close.md)
  §H1 — the auditor finding that surfaced the per-writer commit rule.
