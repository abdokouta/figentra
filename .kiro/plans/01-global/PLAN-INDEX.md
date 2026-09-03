# Figentra Global Plan Index

Global plans contain architecture-wide standards, governance, infrastructure and execution sequencing. They are not package or service implementation plans.

## Canonical global plans

- `service-worker-architecture.md` — service/package/worker boundaries
- `infrastructure-docker-terraform.md` — deployment infrastructure
- `monitoring-infrastructure.md` — telemetry/monitoring infrastructure

Root-level governance documents remain:

- `00-master-platform-plan.md`
- `02-plan-audit-and-completeness.md`
- `03-12-month-implementation-sequence.md`
- `2026-09-03-enterprise-day-one-plan-standard.md`
- `PLAN-GOVERNANCE.md`

## Migration rule

Historical dated package plans at `.kiro/plans/2026-09-03-*-package.md` are legacy paths. A legacy plan must be merged into its canonical package plan under `.kiro/plans/packages/{base|capabilities|runtime|ui}/` before deletion. If no canonical package exists because the concern is now service-owned or consolidated into another package, its useful design must be merged into that owner and the legacy file deleted.

Do not keep aliases, copies or redirect stubs. One implementation contract gets one canonical plan.
