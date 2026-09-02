# Control-Plane / Enterprise Audit — 2026-09-02

## Result

Static architecture and repository-contract checks pass for the changes in this revision. Runtime provider-backed validation is intentionally not claimed because this execution environment has no pnpm, Docker, or Terraform binary and cannot download packages.

## Infrastructure Orchestrator

### Implemented

- Canonical environments: development / staging / production.
- Workspace is constrained to the same canonical environment.
- Separate plan/apply/destroy permissions.
- Staging/production mutations require approval references.
- D1 job state and forward migrations.
- Unique active-job lock per environment.
- Durable Workflow execution with bounded retry and timeout policy.
- Cloudflare Container isolation for Terraform.
- Exact Git SHA checkout.
- Fixed entrypoint; no arbitrary command execution.
- Git access token is unset before Terraform/provider execution.
- Bounded stdout/stderr persistence.
- Explicit control-plane/container split.

### External verification gates

- Real Cloudflare D1 migration run.
- Real Workflow + Container deployment.
- Secret-manager injection verification.
- Staging plan/apply/destroy and rollback drill.
- Concurrent execution test against real state locking.
- Provider-backed integration/security/load tests.
- Production rehearsal.

## Application Registry

### Implemented

- Service-principal registration authorization.
- Dedicated registration and route-resolution audiences.
- Rate limiting.
- Immutable application versions/content hashes.
- Atomic registration batch.
- Audit records.
- Application/metadata/route cache invalidation.
- HTTPS + approved DNS suffix upstream validation.
- Navigation as a first-class persisted category.
- Complete category inventory documented in `workers/registry/README.md`.
- NestJS producer integration in `@figentra/registry` with `forRoot()` and `forFeature()`.

### Explicit category gaps

Events, workflows, integrations, settings, features, widgets, and localization are now first-class versioned Registry metadata categories through `application_catalog_items`; they are constrained by schema and exposed through category/workflow query APIs.

## Dependency / package policy

- 43 `package.json` files audited.
- All external dependency declarations use `catalog:`.
- All internal `@stackra/*` and `@figentra/*` dependencies use `workspace:*`.
- 128 catalog entries are referenced; unused catalog entries are rejected.
- Obsolete `@stackra/eslint-config` is absent.
- Oxlint is the lint standard.
- pnpm stable is pinned to 11.24.0.

## Remaining repository gate

`pnpm-lock.yaml` is still missing because pnpm cannot be downloaded in this isolated execution environment. CI intentionally requires the lockfile. Generate it once on a networked developer/CI machine with pnpm 11.24.0 and commit it before merging.


## Additional decisions applied

- Registry producer discovery: Nest `DiscoveryService` + decorators; Registry runtime remains Worker/Hono + D1.
- Workflow: native Cloudflare Workflows; `@figentra/workflows` is DSL/discovery/adapter only.
- Queue: Cloudflare Queues by default; BullMQ/Redis only through the optional Nest adapter for Node-specific workloads.
- Identity: Supabase Auth remains authoritative for human identity; IAM and Tenant retain their dedicated responsibilities.

## 2026-09-02 workflow/registry completion

The workflow architecture was finalized as a package + Worker split. The old `services/workflow` NestJS deployable is removed. `@figentra/workflows` owns decorators, Nest discovery, framework-neutral contracts, and the Cloudflare adapter; `workers/workflow-runtime` owns executable workflow dispatch and native Cloudflare Workflow execution.

Registry categories previously described as future gaps are now first-class on day one through the versioned `application_catalog_items` table and `/v1/catalog/:category` plus `/v1/workflows` query APIs. The Registry remains metadata-only and never stores executable workflow code.
