# Remaining Platform Services — implementation plan

**Status:** Planned

This index establishes the plan boundary for all remaining service specifications: policy, approval, monetization, entitlements, usage, notifications, files, integrations, reporting, search, and workflow.

Each service is a NestJS bounded context with explicit ownership, versioned contracts, durable state where applicable, IAM authorization, audit integration for security-sensitive mutations, OpenTelemetry observability, health/readiness, failure handling, migrations, conformance tests, and Docker/Terraform deployment coverage where containerized.

## Specifications

- `.kiro/specs/figentra-platform/services/05-policy.md`
- `.kiro/specs/figentra-platform/services/06-approval.md`
- `.kiro/specs/figentra-platform/services/07-monetization.md`
- `.kiro/specs/figentra-platform/services/08-entitlements.md`
- `.kiro/specs/figentra-platform/services/09-usage.md`
- `.kiro/specs/figentra-platform/services/10-notifications.md`
- `.kiro/specs/figentra-platform/services/12-files.md`
- `.kiro/specs/figentra-platform/services/13-integrations.md`
- `.kiro/specs/figentra-platform/services/14-reporting.md`
- `.kiro/specs/figentra-platform/services/15-search.md`
- `.kiro/specs/figentra-platform/services/16-workflow.md`

## Phases
Per service: boundary/contract lock → persistence → API/control plane → security/audit → observability → integration → tests → infrastructure/release.
