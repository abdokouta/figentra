# ADR-0088 — Environment Canonical Identifiers

**Status:** Accepted **Date:** 2026-09-03 **Deciders:** Platform Infrastructure
Standards **Supersedes:** `infrastructure/ENVIRONMENT-STANDARD.md` (deleted,
folded here)

---

## 1. Context

Figentra deploys to three distinct environments — a shared development
substrate, a pre-production staging tier, and the live production tier. Every
subsystem the workspace touches (Terraform, Docker Compose, Wrangler, Doppler,
CI, tests) has its own historical vocabulary for the same three tiers.

Left uncontrolled, that vocabulary splinters:

- Terraform workspaces get named `dev` OR `development` OR `dev-us-east-1`.
- Wrangler environments get named `staging` OR `stg` OR `preview`.
- CI matrix keys drift into `production` / `prd` / `prod` for the same tier.
- Test commands accept `--env=dev` in one repo and `--environment=development`
  in another.

Every drift point produces a bug class: a workspace select that lands in the
wrong state, a build that pushes to the wrong environment, a `terraform apply`
that targets a state file no operator has seen.

## 2. Decision

The repository uses **exactly three canonical environment identifiers**:

| Canonical     | Purpose                                           |
| ------------- | ------------------------------------------------- |
| `development` | Shared local + integration + dev-cloud tier.      |
| `staging`     | Pre-production tier for release candidate builds. |
| `production`  | Live tier receiving customer traffic.             |

These are the **only** identifiers accepted by:

- Terraform workspaces (`terraform workspace select development`).
- `make -C infrastructure/terraform tf-plan ENV=development`.
- `make -C infrastructure/docker compose ENV=development`.
- The `pnpm run infra:*` script's `FIGENTRA_ENV` variable.
- Every `.mk` `VALID_ENVS` filter guard.
- Every `.mjs` script's `ENVIRONMENT` runtime check.

Every subsystem that consumes these names validates against the closed set +
fails fast on any other value.

### 2.1 External aliases (explicit mapping surface)

External systems may use different identifiers because their runtime is not
Figentra-owned. Every external identifier is bound to a canonical one via an
explicit mapping at the boundary — never through implicit convention.

| Canonical     | Doppler (config) | Wrangler (environment) | Terraform (workspace) | Local Compose |
| ------------- | ---------------- | ---------------------- | --------------------- | :-----------: |
| `development` | `dev`            | `development`          | `development`         |      yes      |
| `staging`     | `stg`            | `staging`              | `staging`             |      yes      |
| `production`  | `prd`            | `production`           | `production`          |      no       |

**Rules:**

- External aliases are **not** repository environment names. They appear only in
  external-tool configuration files (`.doppler.yaml`, `wrangler.jsonc`).
- Every mapping is codified in a versioned manifest under
  `infrastructure/environments/*.yaml` — the single source of truth for the
  environment contract.
- Adding a new external tool requires a new column in this ADR + the same
  mapping recorded in `infrastructure/environments/*.yaml`.

### 2.2 Source of truth

`infrastructure/environments/*.yaml` is the single environment source of truth.
Every infrastructure generator (Terraform, Docker Compose, Wrangler render)
consumes or validates against it. No subsystem may maintain a duplicate
environment tree.

### 2.3 Runtime gates

Before deployment, CI must pass:

1. The infrastructure contract check (`pnpm run infra:check`).
2. The CI contract check (`pnpm run ci:contract`).
3. Docker configuration + build + healthcheck tests (`pnpm run docker:test`).
4. Terraform `fmt` + `init` + `validate` + `plan` for the target environment
   (`pnpm run terraform:test`).

`terraform apply` against `production` **additionally** requires the explicit
`CONFIRM=yes-apply-production` operator gate; `terraform destroy` against
`production` requires `CONFIRM=yes-destroy-production`. Both gates are enforced
in `infrastructure/terraform/terraform.mk`.

## 3. Alternatives considered

### 3.1 Adopt shorthand aliases everywhere (`dev` / `stg` / `prd`)

Every subsystem uses the three-letter form uniformly. Simpler on the surface —
fewer characters to type, matches Doppler's config names.

**Rejected because:** the shorthand collides with common Go / shell language
keywords, is ambiguous outside infrastructure context (`dev` = "dev-branch" or
"development-environment"?), and the shorter form obscures the tier in log
output when environment names co-occur with unrelated identifiers.

### 3.2 Per-service environment vocabularies

Each service maintains its own environment name set. The identity service uses
`local` / `staging` / `live`; the notifications service uses `dev` / `qa` /
`prod`. Each subsystem declares its own mapping to whatever substrate it deploys
against.

**Rejected because:** cross-service integration tests + shared observability
require every service to agree on which tier is which. Per-service vocabulary
makes the audit + drift-detection story combinatorial (N services × 3 tiers × M
alias-to-canonical mappings) rather than linear (3 canonical × M external
aliases).

### 3.3 Environment IDs derived from git branch names

Terraform workspace = current git branch. `main` → `production`, `staging` →
`staging`, feature branches → per-branch preview environments.

**Rejected because:** production apply requires an out-of-band operator gate
that ISN'T triggered by branch checkout. The gate is a positive action, not a
side effect of `git checkout main`. Deriving environments from branch names also
produces N production candidates per PR (one per branch that touches `main`),
creating drift the operator can't audit.

## 4. Consequences

**Positive:**

- One-name-per-tier drives simpler tooling: `make tf-plan ENV=production` is
  unambiguous everywhere.
- CI/CD pipelines validate `ENV` against the closed set + fail fast on typos.
- Audit trails (Terraform + CI + observability) index cleanly on three
  identifiers rather than a per-subsystem enum.
- Onboarding: a new operator learns three names, not twelve variants.

**Negative:**

- Reviewers reject PRs that introduce a fourth environment name (e.g. `preview`,
  `qa`, `sandbox`). Adding a genuine new tier requires a new ADR.
- Doppler's `dev` / `stg` / `prd` config-name shape leaks into `.doppler.yaml`
  files — operators must remember the two-form vocabulary at the Doppler
  boundary.

**Enforcement:**

- Every `.mk` file with an environment guard fails hard when `ENV` is not one of
  the three canonical names.
- CI's `ci:contract` script asserts every subsystem's environment enum matches
  the canonical three.
- Reviewers reject any string literal `dev` / `stg` / `prd` inside repository
  code where a canonical name is required (external-tool config exempt).

## 5. References

- `infrastructure/README.md` — infrastructure layout + deployment source model.
- `infrastructure/terraform/terraform.mk` — Terraform environment guard.
- `infrastructure/docker/docker.mk` — Docker environment guard.
- `infrastructure/environments/*.yaml` — canonical environment manifests (single
  source of truth).
- `.kiro/steering/doppler.md` — Doppler config naming (`dev` / `stg` / `prd`
  external aliases).
- ADR-0083 — explicit cloud deployment sources (upstream constraint).
- ADR-0047 — single deployment catalog.
