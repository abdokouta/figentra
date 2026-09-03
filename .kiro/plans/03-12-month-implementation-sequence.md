---
status: canonical
horizon: 12-months
---
# Figentra — 12-Month Implementation Sequence

This sequence implements the locked architecture. It is not permission to redesign boundaries later.

## Phase 0 — Architecture lock
- Approve `.kiro/specs/figentra-platform/ARCHITECTURE.md` and `SERVICE-CATALOG.md`.
- Apply ADR-0024 final domain boundaries and ADR-0025 workflow architecture.
- Remove legacy Scope, Policy, Approval and Entitlements service targets.
- Freeze package/service ownership and contract ownership.

## Phase 1 — Repository and platform foundation
- pnpm/Turbo/build tooling and package publishing.
- `@stackra/contracts`, container, support, errors, config.
- Node/NestJS runtime baseline and service role bootstraps.
- Docker and Terraform environment structure.

## Phase 2 — Persistence and transport
- Database lifecycle, MikroORM, schema/validation, pagination, cache/storage.
- HTTP/OpenAPI, NATS/JetStream, realtime and link.
- Transactional outbox and idempotency primitives.

## Phase 3 — Operational foundation
- Logger and OpenTelemetry integrated into every runtime.
- Health/readiness, graceful shutdown and context propagation.
- Collector, metrics/traces/log storage, dashboards, alerts, SLOs and runbooks.

## Phase 4 — Identity and tenancy
- Identity.
- Tenant.
- IAM including policy definitions/evaluation.

## Phase 5 — Commercial platform
- Monetization including entitlements.
- Usage and metering.

## Phase 6 — Orchestration and governance
- Workflow including human tasks, approvals and compensation.
- Audit.

## Phase 7 — Platform capabilities
- Notifications.
- Files.
- Integrations.
- Search.
- Reporting.

## Phase 8 — Data and growth
- Analytics.
- Marketing.
- Tracking SDK integration.

## Phase 9 — Applications and edge
- Gateway, registry and infrastructure orchestrator.
- Web, React Native, desktop and other product applications.
- Application-specific domain modules remain application-owned unless promoted to a genuine service boundary.

## Phase 10 — Production hardening
- Contract compatibility.
- Load/chaos/failure-mode testing.
- Tenant isolation and security testing.
- Backup/restore and disaster recovery.
- Cost/capacity validation.
- Deployment/rollback verification.

## Phase 11 — Release governance
- Architecture dependency checks.
- Migration gates.
- SLO/error-budget gates.
- Versioned contracts and deprecation policy.
- Operational runbooks and ownership review.

## No-deferral rule

Every phase must implement its locked production contract. No placeholder provider, target shim, fake production driver or post-implementation architecture redesign is permitted.
