# Workspace scripts

Every `scripts/*.mjs` is a Node ESM script run via `pnpm run <task>` or
`node scripts/<name>.mjs`. No script reads secrets — secrets come from Doppler
at runtime.

## Shared library — `scripts/_lib/`

| Module            | Purpose                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `log.mjs`         | Coloured, timestamped stdout/stderr (`log.info` / `log.warn` / `log.error` / `log.section`) |
| `reporter.mjs`    | Pass/fail/warn tally + printed summary + non-zero exit-code discipline                      |
| `cli.mjs`         | Typed CLI flag parsing (`parseArgs({ flags: { dryRun: 'boolean', only: 'string' } })`)      |
| `shell.mjs`       | Spawn-based `sh(cmd, args)` and `shOk(cmd, args)` — no shell, no word-splitting             |
| `http.mjs`        | `httpJson(url, opts)` + `HttpError` — fetch wrapper                                         |
| `concurrency.mjs` | `pool(items, N, fn)` — bounded parallel iteration                                           |
| `fs-walk.mjs`     | `walkGitRepos(root)` — enumerate git repos under a base dir                                 |
| `gitlab.mjs`      | GitLab REST v4 wrapper (protected branches, MR API, tags)                                   |
| `paths.mjs`       | Workspace path constants (`REPO_ROOT`, `PACKAGES_DIR`, etc.)                                |
| `env-naming.mjs`  | Layer 1 canonical env-name map from `env-naming.md` §Rule 4                                 |
| `repos.mjs`       | `WORKSPACE_REPOS` inventory for cross-repo fan-out scripts                                  |
| `index.mjs`       | Barrel — re-exports public functions                                                        |

## Validation scripts

Wired into `pnpm run standards:all` → `pnpm run check` → CI.

| Script                              | `pnpm run`               | What it checks                                  |
| ----------------------------------- | ------------------------ | ----------------------------------------------- |
| `validate-standards.mjs`            | `standards:check`        | Orchestrates all checks below                   |
| `check-toolchain.mjs`               | `toolchain:check`        | Node version, pnpm version, packageManager pin  |
| `check-yaml.mjs`                    | `yaml:check`             | Every YAML file parses without error            |
| `check-package-catalogs.mjs`        | `packages:catalog:check` | catalog.json mandatory fields per package       |
| `check-export-maps.mjs`             | `packages:exports:check` | exports map matches tsup entries                |
| `check-dependency-policy.mjs`       | `dependencies:check`     | catalog: for third-party, workspace:^ for peers |
| `check-local-packages.mjs`          | `packages:local:check`   | package.json matches its tier shape             |
| `check-docblocks.mjs`               | `docs:check`             | Every source file has a @file docblock          |
| `check-messaging-contracts.mjs`     | `messaging:check`        | Cross-service event/NATS contract consistency   |
| `check-ci-contract.mjs`             | `ci:contract`            | .gitlab-ci.yml stages + required jobs           |
| `check-infrastructure-contract.mjs` | `infra:test`             | Terraform, Docker, cloud.yaml consistency       |
| `check-terraform-policy.mjs`        | `terraform:policy`       | No hard-coded secrets in .tf files              |
| `check-control-planes.mjs`          | `control-planes:check`   | Health + readiness endpoints per service        |
| `validate-workers-structure.mjs`    | `workers:check`          | Worker canonical file structure                 |

## Infrastructure scripts

Live in `infrastructure/scripts/` and `infrastructure/docker/scripts/`:

| Script                                               | Purpose                                                   |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `infrastructure/scripts/collect-cloud-yaml.mjs`      | Build deployment catalog → `.generated/catalog.json`      |
| `infrastructure/scripts/validate-modules.mjs`        | Validate capability module registry + deployable modules  |
| `infrastructure/docker/scripts/generate-compose.mjs` | Generate Docker Compose → `.generated/docker-compose.yml` |
| `infrastructure/docker/scripts/validate-compose.mjs` | Validate generated Compose against catalog                |

## Utility scripts

| Script      | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `clean.mjs` | Remove generated build/test artifacts across the workspace |

## Running

```bash
pnpm run standards:check    # all validation checks
pnpm run check              # standards + infra checks
pnpm run ci                 # check + build (full CI gate)
```
