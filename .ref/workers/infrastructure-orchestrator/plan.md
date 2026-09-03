# Infrastructure Orchestrator — Production Plan

## Purpose
The Infrastructure Orchestrator is a control-plane API for requesting, approving,
tracking, and executing infrastructure changes. The Worker never executes arbitrary
Terraform or shell commands itself.

## Runtime
- Cloudflare Worker + Hono control plane.
- Durable Object / Workflow for durable execution state.
- Cloudflare Container as the isolated Terraform execution runner.
- Terraform rooted at `infrastructure/terraform`.
- D1 for orchestration/job metadata where required.
- `@figentra/observability/worker` + Pino.

## Security model
1. Authenticate caller.
2. Resolve service identity / human principal.
3. Authorize requested operation and environment.
4. Require immutable source revision.
5. Create an execution record.
6. Require approval for protected environments.
7. Dispatch only an allowlisted Terraform operation to the isolated runner.
8. Stream/record structured execution state.
9. Persist plan/apply result.
10. Support explicit rollback/recovery workflows.

## Completed
- Hono control-plane scaffold.
- Request/correlation context.
- Authentication boundary.
- Security headers.
- Worker logging.
- D1/Workflow/Container declarative contract.
- Terraform root contract.
- Arbitrary-command prohibition.
- Source-revision requirement.
- Environment naming: development/staging/production.
- Route organization.

## Verified implementation controls

- [x] D1 schema + forward migrations.
- [x] Workflow + Container declarations in Wrangler.
- [x] Runtime-only runner credentials.
- [x] Exact 40-character Git revision requirement.
- [x] Canonical development/staging/production environment model.
- [x] Workspace must equal environment.
- [x] Plan/apply/destroy permissions are distinct.
- [x] Staging/production mutations require an approval reference.
- [x] One queued/running execution per environment.
- [x] Workflow retries/timeouts.
- [x] Bounded Terraform output persistence.
- [x] No arbitrary shell commands or arbitrary repository paths.

## External production gates

These cannot be honestly marked complete from source inspection alone:

- [ ] Execute real D1 migration deployment.
- [ ] Deploy the Workflow and Terraform Container in a non-production Cloudflare account.
- [ ] Inject production secrets through the approved secret manager.
- [ ] Run staging plan/apply/destroy rehearsal and rollback drill.
- [ ] Verify Terraform state locking against concurrent requests.
- [ ] Run integration/load/security testing with real provider credentials.
- [ ] Run controlled production deployment rehearsal.

The implementation is production-structured; these are environment-backed verification gates, not missing source architecture.

## Non-goals
The Worker must never become a remote shell. No arbitrary command, arbitrary URL,
or arbitrary Terraform module path may be accepted from an API caller.
