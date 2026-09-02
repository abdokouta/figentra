# V2 Notice

The authoritative next-phase task list is `TASKLIST-V2.md`. Phase 0 architecture and standards approval is mandatory before implementation.

# Figentra Standardization and Production Task List

Status legend: `[x]` completed in repository, `[ ]` pending, `[~]` requires a
real external environment/account or a deliberate exception decision.

## PHASE 1 — Repository

- [x] Root package manager
- [x] npm overrides
- [x] Turbo
- [x] Root scripts
- [x] Root configs
- [x] Canonical environment names: `development`, `staging`, `production`
- [x] CLI aliases: `dev`, `stg`, `prd`
- [x] Repository engineering standards documentation
- [x] Root validation/doctor conventions

## PHASE 2 — Stackra packages

- [x] Package-by-package `package.json` standardization
- [x] `catalog.json` for every publishable Stackra package
- [x] Export map verification
- [x] Peer dependency verification
- [x] Optional peer dependency verification
- [x] Dev dependency verification
- [x] Runtime dependency verification
- [x] Stackra TypeScript config
- [x] Stackra tsup config
- [x] Shared Vitest preset
- [x] `__tests__/unit`
- [x] `__tests__/integration`
- [x] `__tests__/vitest.setup.ts`
- [x] Documentation
- [x] Oxlint
- [x] Prettier
- [x] TSDoc coverage
- [x] Package/catalog consistency scanner
- [x] Export/dist consistency scanner

## PHASE 3 — Nest services

- [x] Package.json standardization
- [x] Fastify adapter
- [x] SWC
- [x] Nest CLI
- [x] `tsconfig.json`
- [x] `tsconfig.build.json`
- [x] Vitest
- [x] `__tests__/unit`
- [x] `__tests__/integration`
- [x] `__tests__/e2e`
- [x] `__tests__/vitest.setup.ts`
- [x] i18n
- [x] Source organization
- [x] Interfaces/types/enums/constants file rules
- [x] Decorator/guard/interceptor conventions
- [x] Documentation/comments/TSDoc
- [x] Docker
- [x] `cloud.yaml`
- [x] Health/readiness
- [x] Pino observability
- [x] Configuration validation
- [x] NATS adapter
- [x] IAM authorization interceptor

## PHASE 4 — Workers

- [x] Gateway scaffold
- [x] Registry scaffold
- [x] Infrastructure Orchestrator scaffold
- [x] Worker source organization
- [x] Worker tests foundation
- [x] Wrangler configuration
- [x] `cf-typegen`
- [x] `cloud.yaml`
- [x] Gateway authentication
- [x] Gateway routing
- [x] Gateway registry Service Binding
- [x] Gateway rate-limit boundary
- [x] Gateway correlation/trace propagation
- [x] Registry D1 schema/migrations
- [x] Registry metadata
- [x] Registry versioning
- [x] Registry modules/resources/actions
- [x] Registry capabilities
- [x] Registry branding/theme metadata
- [x] Registry KV cache
- [x] Registry security/registration policy
- [x] Registry audit trail
- [~] Real staging Worker deployment verification
- [~] Real production Worker deployment verification

## PHASE 5 — Vite apps

- [x] Portal standardization
- [x] Landing Page standardization
- [x] HeroUI 3
- [x] React 19
- [x] Tailwind 4
- [x] React Router 7
- [~] Stackra Query
- [~] Stackra HTTP/State integration
- [~] Unit tests
- [~] Integration tests
- [~] E2E tests
- [x] `__tests__/vitest.setup.ts`
- [x] Documentation/comments
- [x] Oxlint
- [x] Prettier
- [x] `cloud.yaml`

## PHASE 6 — Infrastructure

- [x] Terraform module standardization
- [x] `main.tf`
- [x] `variables.tf`
- [x] `versions.tf`
- [x] `outputs.tf`
- [x] Environment roots
- [x] Development environment
- [x] Staging environment
- [x] Production environment
- [x] Docker generator
- [x] Compose generator
- [x] `cloud.yaml` collector
- [x] Environment validation
- [x] Terraform plan policy
- [x] Terraform apply policy
- [x] Terraform destroy policy
- [x] Provider version pinning
- [x] Terraform documentation/comments

## PHASE 7 — Registries

- [x] Application registry
- [x] Resource registry
- [x] Route registry
- [x] Event registry
- [x] Permission registry
- [x] Integration registry
- [x] Workflow registry
- [x] Health registry
- [x] Build-time scanners
- [x] Generated manifests
- [x] Deterministic registry generation
- [x] Registry contract validation

## PHASE 8 — Quality gates

- [x] Oxlint
- [x] Prettier
- [x] TypeScript
- [x] Vitest
- [x] TSDoc
- [x] Package consistency
- [x] Manifest consistency
- [x] Dependency consistency
- [x] Catalog/package consistency
- [x] Export/dist consistency
- [x] Security checks
- [x] Secret scanning
- [x] License checks
- [x] Dependency vulnerability policy
- [x] Docker image scanning

## PHASE 9 — Infrastructure Orchestrator

- [~] Terraform provision real Orchestrator D1/Workflow/Container
- [~] Configure production runner secrets
- [~] Run real development plan
- [~] Run real staging plan/apply
- [~] Execute rollback drill
- [~] Production approval/change test
- [~] Production apply
- [x] Runner egress policy verification
- [x] Runner image provenance verification
- [x] Short-lived/scoped cloud credentials
- [x] Orchestrator audit trail
- [x] Orchestrator idempotency
- [x] Orchestrator concurrency lock
- [x] Orchestrator failure recovery
- [x] Orchestrator job retention policy

## PHASE 10 — Final enterprise gate

- [~] Full monorepo build
- [~] Full typecheck
- [~] Full lint
- [~] Full unit tests
- [~] Integration tests
- [~] E2E
- [~] Security tests
- [~] Load tests
- [~] Deployment rehearsal
- [~] Disaster/rollback rehearsal
- [~] SLO verification
- [~] Alerting verification
- [~] Backup/restore verification
- [~] Production change-control verification
- [~] Production release approval

## Cross-cutting standards

- [x] Long-form environment naming standard
- [x] YAML documentation/comment standard
- [x] Package catalog ownership standard
- [x] Stackra TypeScript/tsup/Vitest standard
- [x] Test layout standard
- [x] NestJS service standard
- [x] Worker standard
- [x] Vite application standard
- [x] One-export-per-declaration-file convention
- [x] Secret-management convention
- [x] Documentation/TSDoc convention
- [x] Automated repository standards validator

## External/semantic completion notes

`[~]` items are intentionally not marked `[x]` because they require either
product-specific assertions, a real provider/account, or a package that is not
present in this repository. In particular:

- The exact package named `@stackra/query` is not present in this repository;
  current public Stackra packages include `@stackra/http` and `@stackra/state`.
  The latter two are cataloged as application dependencies, but their application
  APIs are not guessed or wired without the actual application data contracts.
- Unit/integration/E2E test harnesses and service health smoke tests are present,
  but complete business-coverage suites cannot be generated truthfully without
  each service's finalized business rules.
- Full monorepo execution requires Node 24, pnpm, installed Stackra presets, and
  the repository lockfile. The execution environment used for this pass does not
  provide pnpm/Node 24.
- Terraform deployment, provider credentials, live NATS/Supabase/Cloudflare
  accounts, production secrets, load testing, rollback drills, and production
  approvals require the real operator environment.
