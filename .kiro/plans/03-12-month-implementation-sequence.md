---
status: canonical
horizon: 12-months
---
# Figentra — 12-Month Implementation Sequence

This sequence implements the already-decided architecture; it is not permission to redesign boundaries later.

## Phase 0 — Architecture lock
- Validate steering, specs and ADRs against `.kiro/plans/02-plan-audit-and-completeness.md`.
- Remove/mark superseded duplicate plan targets.
- Freeze contracts, package taxonomy, service ownership and runtime roles.
- Establish CI gates for lint/typecheck/unit/contract/integration/e2e and architecture dependency checks.

## Phase 1 — Repository/platform foundation
- pnpm workspace/Turbo/build tooling and package publishing.
- `@stackra/contracts`, container, support, errors, config.
- Node/NestJS runtime baseline, service template and role bootstraps.
- Docker build standards and Terraform environment/state structure.

## Phase 2 — Persistence and transport
- Database lifecycle, MikroORM, schema/validation, pagination, cache/storage.
- HTTP client/server policy, NATS transport, realtime and link.
- Transactional outbox/event infrastructure and idempotency primitives.

## Phase 3 — Operational foundation
- Logger and OpenTelemetry observability integrated into every runtime.
- Health/readiness/liveness, graceful shutdown, correlation/trace propagation.
- Collector/exporter infrastructure, dashboards, alerts, SLOs, retention, backup/DR and telemetry failure tests.

## Phase 4 — Identity and access
- `@stackra/identity` with real Supabase adapter.
- Identity service principal/session state.
- Tenant/scope/IAM/policy services and service authentication.
- Approval workflow and audit integration.

## Phase 5 — Commercial/platform services
- Monetization, entitlements and usage.
- Notifications and files.
- Integrations and webhook/reconciliation flows.

## Phase 6 — Data/product signals
- Tracking SDK across browser/mobile/desktop.
- Analytics ingestion, facts/dimensions, aggregation, attribution and query APIs.
- Marketing audiences, campaigns, journeys and activation.
- Reporting and search projections/read models.

## Phase 7 — Workflow and asynchronous scale
- Workflow execution/timers/compensation.
- Service worker/consumer/scheduler roles with bounded concurrency, retry/DLQ, leases and reconciliation.
- Independent gateway/registry/infrastructure-orchestrator workers only where their ADR/spec requires.

## Phase 8 — Applications
- Portal, Family, Landing Page and Mobile application compositions.
- Router/navigation/i18n/theming/UI runtime packages.
- Identity/tracking/realtime integration with secure client storage.

## Phase 9 — Production hardening
- Load, soak, chaos/failure-mode and migration rehearsal.
- Security review, dependency/SBOM scanning, secret rotation and least-privilege review.
- Tenant isolation and authorization conformance suite.
- Backups/restore/DR rehearsal and operational runbooks.

## Phase 10 — Release governance
- Versioned contracts and packages, changelogs and deprecation gates.
- Progressive rollout/rollback and schema compatibility checks.
- SLO/error-budget review and capacity planning.

## Definition of done
Every planned component has implementation files, tests, contracts, observability, security controls, migration/compatibility behavior and deployment configuration. No component is marked complete while relying on a placeholder production driver, target shim or deferred architecture decision.
