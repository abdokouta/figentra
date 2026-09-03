# ADR-0089 — Pre-Push vs CI Verification Split

**Status:** Accepted
**Date:** 2026-09-03
**Deciders:** Developer Experience + Platform Infrastructure

---

## 1. Context

The workspace ships two verification gates:

- **Local pre-push** — a Husky `pre-push` hook that runs before `git push`
  succeeds. Fast, blocks the developer, must complete in single-digit seconds
  or developers routinely bypass it with `--no-verify`.
- **CI** — the GitLab pipeline that runs on every merge request. Slower gate,
  runs everything, is the authoritative pass/fail contract for a merge.

Historically both gates ran `pnpm check`, which chains:

```text
pnpm run standards:check
  ├── pnpm run standards:check          (validator script)
  ├── pnpm run packages:catalog:check   (per-package catalog.json)
  ├── pnpm run packages:exports:check   (exports vs tsup config)
  ├── pnpm run packages:local:check     (workspace member manifest tier)
  ├── pnpm run dependencies:check       (catalog: vs workspace:^ vs bare)
  ├── pnpm run workers:check            (worker structure validation)
  ├── pnpm run docs:check               (per-file docblock enforcement)
  └── pnpm run ci:contract              (CI-contract validation)
pnpm run infra:check                    (Terraform / Docker / cloud.yaml)
```

That contract takes tens of seconds even on a warm cache. On cold cache it
regularly crosses the two-minute mark. At those latencies, developers either
switch to `git push --no-verify` (bypassing the gate entirely) or stop
pushing WIP branches for peer feedback (losing the collaboration value the
hook was meant to enable).

## 2. Decision

**Split the gate.** The pre-push hook runs a lightweight `pnpm verify`; CI
runs the full `pnpm check`. Each gate is authoritative for a distinct concern:

### 2.1 Pre-push — `pnpm verify` (single-digit seconds)

```text
pnpm verify
  ├── pnpm run format:check   (Prettier — read-only formatting check)
  ├── pnpm run lint            (Oxlint — read-only lint check)
  └── pnpm run check-types    (tsc --noEmit — turbo-cached)
```

Every step is:

- **Cache-friendly** — turbo memoises repeat runs, so the second push on the
  same working tree is near-instant.
- **Deterministic** — same input, same output; the gate never fails
  intermittently.
- **Actionable** — every failure names a specific file + line the developer
  can fix without reading a script.

The `pnpm verify` script is codified in root `package.json` as a first-class
script — not a synthetic alias — so it appears in `pnpm run` output + editor
integrations.

### 2.2 CI — `pnpm check` (full standards suite)

Every push to a merge request runs the CI pipeline; every merge-request
pipeline runs `pnpm check` + `pnpm run build` end-to-end. This gate is
authoritative for:

- Per-package catalog / exports / dependency policy.
- Worker structure conformance.
- Docblock coverage.
- CI contract validation.
- Infrastructure contract (Terraform validate + Docker compose config).

Failing this gate at CI blocks the merge; passing the pre-push hook does NOT
imply the CI gate will pass.

### 2.3 The tradeoff

Splitting the gate accepts that a developer CAN push a branch that fails CI.
That's the intended behaviour — pushing to a feature branch is not the same
as merging to `main`. The hook's job is to catch obviously-broken states
before the developer wastes CI runner minutes. CI's job is to enforce the
full standards contract before merge.

## 3. Alternatives considered

### 3.1 Keep `pnpm check` in the pre-push hook

Same gate everywhere. Simple. Zero risk that CI catches something the
developer missed.

**Rejected because:** empirical data across the workspace's history shows
developers routinely `--no-verify` when the hook exceeds ~10 seconds. A hook
that's bypassed is worse than a hook that catches a small set of issues
reliably. The behaviour we optimise for is "hook stays enabled"; that
requires the hook to be fast.

### 3.2 Move every check to CI, drop the pre-push hook

No local gate at all. Zero local latency. CI is the sole enforcement point.

**Rejected because:** the pre-push gate catches formatter drift + lint errors
+ typecheck errors that would otherwise waste ~5 minutes of CI runner time
per push. A single-digit-second local gate that catches 80% of common
mistakes is a large productivity win over a five-minute CI turnaround.

### 3.3 Async pre-push — run the full check in the background

Push proceeds immediately; the full `pnpm check` runs in a detached process +
notifies via desktop notification on failure.

**Rejected because:** the workspace uses Husky for both cross-platform
compatibility (macOS + Linux dev workstations) and shell simplicity. Async
detached processes in shell have brittle cross-platform semantics + zero
reliable notification story on the workspace's Linux/macOS mix. The `pnpm
verify` split gets the productivity win without the platform-specific
complexity.

## 4. Consequences

**Positive:**

- Pre-push hook stays under ~5 seconds on warm cache — developers keep the
  hook enabled instead of bypassing.
- CI enforces the full standards contract at the correct enforcement level
  (merge, not push).
- `pnpm verify` becomes a callable first-class gate for editor integrations,
  save-hooks, and manual invocation.

**Negative:**

- A developer can push a branch that fails CI. Merge review must catch this
  — reviewers reject MRs where the pipeline is red.
- Two verification gates require operators to remember which gate covers
  which check. This ADR + `.husky/pre-push`'s docblock name the contract
  explicitly to make the boundary self-documenting.

**Enforcement:**

- `.husky/pre-push` runs `pnpm run verify` (not `pnpm check`).
- `.gitlab-ci.yml` runs `pnpm check` + `pnpm run build` in the CI pipeline.
- Reviewers reject MRs where the CI gate is red; the pre-push hook is
  non-authoritative for merge decisions.
- Bypassing the pre-push hook with `git push --no-verify` remains supported
  for emergency cases (broken hook environment, pre-commit-loop investigation)
  — but every such push is expected to pass CI on arrival.

## 5. References

- `.husky/pre-push` — the actual pre-push script (references this ADR in its
  docblock).
- `.husky/pre-commit` — the commit-time formatter/lint-staged gate (unchanged
  by this ADR).
- `.husky/commit-msg` — the commit-message validation gate (unchanged).
- `.gitlab-ci.yml` — the CI pipeline (unchanged; already runs `pnpm check`).
- `package.json` — the `verify` + `check` + `ci` script definitions.
- ADR-0087 — canonical `@/` path alias + test-init contract (upstream of the
  standards suite this ADR splits).
