# Infrastructure Batch — Explicit Deployment Sources, Docker, Terraform

**Status:** Source/refactor implementation complete; provider runtime gates require the operator environment.

## Cloud catalog

- [x] Root `cloud.yaml` owns explicit local deployment `paths`.
- [x] Root `cloud.yaml` keeps external repositories under `repos`.
- [x] Root `cloud.yaml` keeps product/brand composition under `products`.
- [x] Collector no longer auto-discovers apps/services/workers outside `paths`.
- [x] Every enrolled local source must contain `cloud.yaml`.
- [x] Duplicate deployable slugs fail the collector.
- [x] Unknown brands fail the collector.
- [x] Unsupported runtimes fail the collector.
- [x] Generated `infrastructure/catalog.json` is the only Terraform/Docker catalog input.

## Gateway migration

- [x] Gateway is `services/gateway`.
- [x] Gateway runtime is Cloudflare Container + NestJS/Fastify.
- [x] `workers/gateway` is not a deployment source.
- [x] Worker binding renderer no longer accepts Gateway.
- [x] Gateway WAF/DNS/container routing is represented by Terraform.
- [x] Gateway ADR and active Kiro service specification updated.

## Docker

- [x] Docker generator consumes generated catalog only.
- [x] Docker generator supports development/staging/production names.
- [x] Application dependencies are derived from capabilities.
- [x] Health checks use the service health contract.
- [x] Docker Compose validation rejects secret-bearing keys.
- [x] Dockerfiles standardized on npm rather than pnpm.
- [x] Docker infrastructure dependencies are centralized in `docker.yaml`.
- [x] Docker environment manifests use full canonical names.
- [x] Generated Compose includes Gateway.

## Terraform

- [x] One canonical Terraform root.
- [x] `development`, `staging`, `production` are the only canonical workspaces.
- [x] Removed duplicated skeleton environment root.
- [x] Reusable module contract is `main.tf`, `variables.tf`, `versions.tf`.
- [x] Orchestrator durable D1/Workflow module is composed by the root.
- [x] Cloudflare WAF uses current `cloudflare_ruleset` model.
- [x] Cloudflare HTTP rate limiting uses `http_ratelimit` rulesets.
- [x] Production apply/destroy confirmation gates remain enforced.
- [x] Wrangler renderer is limited to actual Workers: Registry and Infrastructure Orchestrator.
- [x] Terraform policy/contract gate added.

## Runtime gates — must execute in the operator environment

- [ ] `npm install` with the repository's real npm registry and credentials.
- [ ] Commit the resulting `package-lock.json` and rerun `npm install`/`npm ci`.
- [ ] `npm run catalog`.
- [ ] `npm run infra:check`.
- [ ] `npm run docker:compose`.
- [ ] `npm run docker:validate`.
- [ ] `docker compose config`.
- [ ] `docker build` for all production services.
- [ ] `terraform init`.
- [ ] `terraform fmt -check -recursive`.
- [ ] `terraform validate` in each canonical workspace.
- [ ] `terraform plan` in development.
- [ ] staging plan/apply.
- [ ] production plan/apply under protected approval.

The source implementation deliberately does not mark these provider/runtime
operations complete without executing them against the real toolchain and
credentials.
