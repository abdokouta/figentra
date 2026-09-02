# Figentra monorepo production-readiness audit

**Date:** 2026-08-30  
**Scope:** Read-only audit of the current Figentra root scaffold and `.ref/`
reference material. The Figentra workspace was used only as a governance and
tooling reference. No production resources, Doppler projects, credentials, or
repository files were changed.

## Verdict

The repository is a useful architecture and directory scaffold, but it is not
yet an executable or production-ready monorepo. Treat it as **pre-bootstrap**.
It must first be made into an independent Git repository with one canonical
configuration set. It must not copy the Figentra tooling workspace's catalog,
Doppler binding, or historical ignore rules unchanged.

## Evidence summary

- The root contains `package.json`, `package.json workspaces`, `turbo.json`,
  `tsconfig.base.json`, `.nvmrc`, `.mcp.json`, `.doppler.yaml`, and architecture
  documents.
- No root `apps/`, `workers/`, `applications/`, or `packages/` directory exists,
  although `package.json workspaces` globs all four.
- There is no `pnpm-lock.yaml`, `.npmrc`, `.gitlab-ci.yml`, CI component tree,
  Docker Compose file, release/change-management configuration, or Git
  repository metadata.
- `infrastructure/terraform/` is placeholder-only and does not yet include
  provider pins, a backend, a lockfile, complete module shape, or a deployable
  environment composition.
- `.ref/` is ignored and is reference material only. It contains the older
  generated skeleton and Terraform artifacts; it must not become a second source
  of truth.

## Blocking findings

### P0 — establish repository identity and source-of-truth boundaries

1. **No Git repository exists.** There can be no branch protection, merge
   request review, release provenance, GitLab pipeline, secret scan, or
   reproducible version history until the repository is initialized and linked
   to its intended GitLab project.
2. **`cloud.yaml` is a copied Figentra workspace catalog.** It describes
   `master` and `academorix` and their split repositories, not the Figentra
   monorepo. Replace it with a Figentra-specific, repository-local catalog or
   keep the canonical multi-repo catalog solely in `figentra-workspace`. Do not
   maintain both as independent sources of truth.
3. **`.doppler.yaml` targets `figentra-workspace`.** That is the tooling
   project's binding, not a Figentra binding. Before enabling any command,
   choose the owning Doppler workplace and define a dedicated Figentra tooling
   project. Each deployable then receives its own binding and `dev`, `stg`, and
   `prd` configurations.
4. **The workspace globs point at nonexistent folders.** Create the declared
   package roots before installing dependencies or remove the globs until the
   bootstrap is ready.
5. **No lockfile exists.** `pnpm-lock.yaml` is mandatory and must be committed.
   CI must use `npm install --frozen-lockfile`.

### P0 — protect secret and deployment boundaries

1. **The `.gitignore` permits `.env.production`.** It ignores `.env`,
   `.env.local`, and local variants, but not general `.env.*` files. Adopt an
   allowlist model: ignore `.env*` and explicitly retain only `.env.example`
   (and public, non-secret examples only when genuinely required).
2. **The committed portable `.mcp.json` correctly uses placeholders.** A
   redacted structural scan found no likely literal secret prefixes in
   `.kiro/settings/mcp.json` either. Preserve that property: all MCP tokens must
   remain `${VAR}` placeholders, never command arguments containing a literal
   token.
3. **Doppler and runtime secrets need separate scopes.** The root tooling
   Doppler project may hold Terraform/CI/provider credentials. It must not
   contain application runtime secrets. Each Worker, Container service, and
   browser application needs its own project/config binding; browser-visible
   values need explicit public-prefix and exposure review.
4. **Terraform state and deploy artifacts must remain secret-free.** Do not
   commit `*.tfvars`, state, plans, Wrangler local state, Docker env files, or
   credentials. The reference package contains historical `terraform.tfvars`;
   retain it only as ignored reference material, never copy its values.

## High-priority implementation findings

### Package manager and root manifest

- Pin an exact package manager with Corepack, for example `pnpm@11.x.y`; the
  current `pnpm@10` conflicts with the Figentra governance baseline of pnpm 11+.
- Add `engines` for Node and pnpm, retain `private: true`, and set `type` only
  after every executable package follows ESM conventions.
- Add root scripts for `check`, `test:unit`, `test:integration`, `test:e2e`,
  `test:coverage`, `format:check`, `changeset`, `release`, `infra:*`,
  `deploy:*`, `secrets:scan`, and `doctor`. Deployment and apply commands must
  be explicit environment-scoped operations, never part of `build`.
- Add `.npmrc` with a deliberately selected linker, strict peer-dependency
  policy, package-manager enforcement, registry policy, and no accidental npm or
  Yarn lockfile creation.

### TypeScript

- `tsconfig.base.json` currently combines NodeNext resolution with global
  declaration emission. That is not a universal base for Vite, Workers, and
  NestJS.
- Keep a strict common base, then create target-specific configurations:
  `tsconfig.node.json`, `tsconfig.worker.json`, `tsconfig.web.json`, and a
  package build configuration. Worker projects should use the Wrangler/Vite
  compatible module-resolution mode; apps should not emit declarations; shared
  packages should use `composite` project references and declaration output.
- Define path aliases only if they are mirrored by each runtime/bundler. Do not
  rely on TypeScript paths as a runtime resolver.

### Turborepo

The current file is a minimal demo configuration. Define the production task
contract before package creation:

| Task                                | Cache           | Key requirements                                        |
| ----------------------------------- | --------------- | ------------------------------------------------------- |
| `build`                             | yes             | depends on `^build`; target-specific outputs only       |
| `lint`, `typecheck`, `format:check` | yes             | no output artifacts                                     |
| `test:unit`                         | yes             | JUnit/coverage as CI artifacts, not cache inputs        |
| `test:integration`, `test:e2e`      | normally no     | explicit service lifecycle and artifact paths           |
| `dev`                               | no              | persistent and interruptible                            |
| `deploy:*`, `infra:apply`           | never           | non-cacheable, environment protected, explicit approval |
| `infra:plan`                        | no shared cache | emits reviewed plan artifact only                       |

- Add `globalDependencies` for root toolchain/config files and generated
  contract sources that affect all tasks.
- Declare public build-time variables under `env`; use `passThroughEnv` only for
  process values that must be available without changing cache identity. Do not
  inject secrets into cacheable build/test tasks unless the task output
  genuinely depends on them; never expose server secrets to browser builds.
- Do not narrow a task's `inputs` unless every relevant dependency,
  configuration, and generated source is included. The current `test` inputs
  omit common root configuration and can produce stale cache hits.

### CI/CD, quality, and release

- Add a GitLab pipeline with separate verify, test, build, security,
  infrastructure-plan, staging-deploy, production-deploy, and release stages.
- Use `workflow:rules`, path-aware rules, protected environments, manual
  production promotion, artifact access controls, and cache keys based on the
  lockfile. Pin any included CI component to a protected tag or commit.
- Require lint, typecheck, unit tests, integration tests, Terraform format and
  validate, secret scan, dependency audit/SBOM, container scan, and IaC scan.
- Add CODEOWNERS, contribution/security policy, license, changeset or another
  declared release process, Renovate/Dependabot policy, and conventional commit
  or merge-request title validation.

### Runtime and infrastructure

- Each Worker must own a `wrangler.jsonc`, typed bindings, local development
  script, migration policy for Durable Objects/D1, and a deployment task.
- Each Container-backed service needs its NestJS service, Worker/Container
  adapter, Dockerfile, `.dockerignore`, health/readiness contract, structured
  logging, non-root image policy, and deployment configuration.
- Keep Terraform as the durable infrastructure control plane and Wrangler as the
  Worker/Container artifact deployer. Do not manage the same artifact with both.
- Terraform needs root and module provider/version files, remote backend,
  environment composition, `terraform fmt`/`validate`/plan workflow, explicit
  import/migration policy, and a committed provider lockfile where appropriate.

## Required baseline file set

```text
.
├── .gitlab-ci.yml
├── .gitlab/ci/{verify,test,build,security,infra,deploy,release}.yml
├── .npmrc
├── .nvmrc
├── .node-version
├── .gitignore
├── .gitleaks.toml
├── .mcp.json                  # placeholders only
├── .doppler.yaml              # Figentra tooling project only
├── .env.example               # documented, non-secret names only
├── package.json
├── package.json workspaces
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json
├── tsconfig.{node,worker,web}.json
├── eslint.config.mjs
├── prettier.config.mjs
├── commitlint.config.mjs
├── CODEOWNERS
├── SECURITY.md
├── CONTRIBUTING.md
├── LICENSE
├── renovate.json
├── apps/
├── workers/
├── services/
├── packages/
├── infrastructure/terraform/
└── docs/
```

` .creatorignore` is not a broadly standard production control. If the request
means `.cursorignore`, `.claudeignore`, or another tool-specific ignore file,
add it only after naming its consumer and scope. It must never be relied on as a
security boundary; `.gitignore`, secret scanning, least-privilege MCP, and
Doppler remain the controls.

## Recommended next change set

Perform a **bootstrap hardening pass** only: initialize Git, replace copied root
identity files, create the real workspace roots, lock Node/pnpm, add the root
quality/CI/security configuration, and finalize the Turbo/TypeScript contract.
Do not provision Doppler projects, Terraform resources, or deploy services in
that pass.

## External references consulted

- [Turborepo environment variables](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)
- [Turborepo configuration reference](https://turborepo.com/docs/reference/configuration)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [GitLab CI/CD YAML reference](https://docs.gitlab.com/ci/yaml/)
- [GitLab pipeline security](https://docs.gitlab.com/ci/pipeline_security/)
