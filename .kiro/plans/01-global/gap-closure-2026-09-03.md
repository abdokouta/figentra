# 2026-09-03 Architecture Gap Closure

## Applied decisions

- Monitoring infrastructure is now a first-class Docker + Terraform plan.
- OpenTelemetry is infrastructure-integrated from day one; it is not a future logger subpath.
- Audit is a first-class capability with package, service, and worker ownership.
- Audit is explicitly separate from logs, traces, domain events, tracking, analytics, and authorization.
- Services, workers, and apps have dedicated plan namespaces and indexes.
- Cloudflare Workers remain provider-native; Docker is required where a worker is container-deployed, not as a forced abstraction.
- Durable infrastructure is Terraform-managed or explicitly declared as an external managed service.
- Environment boundaries are development/staging/production with isolated Terraform state.
- Security-sensitive mutations must integrate audit; telemetry must never become the audit system of record.
- Worker processing uses explicit execution context, idempotency, retries, DLQ, replay and reconciliation.

## Remaining relocation work

Existing detailed package plans must be physically relocated from the historical flat `.kiro/plans/2026-09-03-*-package.md` naming scheme into `packages/base`, `packages/capabilities`, and `packages/runtime` without rewriting or weakening their contents. Historical superseded records such as the standalone auth plan remain only if retained as migration/supersession records.

## Day-one enforcement

The implementation checklist must gate completion on package/service/worker/app conformance, Docker image reproducibility, Terraform validation/plan/policy checks, monitoring flow tests, audit durability/idempotency/tenant isolation, and production runbooks.
