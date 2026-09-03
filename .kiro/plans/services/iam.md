# IAM Service — implementation plan

**Status:** Planned

## Purpose
Deployable authorization bounded context for roles, permissions, policies, assignments, and authorization decisions.

## Dependencies
Identity, scope, contracts, database/ORM, audit, observability.

## Related specification
`.kiro/specs/figentra-platform/services/04-iam.md`

## Phases
Scaffold → authorization contracts → persistence → policy evaluation → APIs → audit/security → observability → tests → deployment.

## Exit criteria
Centralized, deterministic, tenant-aware authorization with auditable decisions and production-grade failure behavior.
