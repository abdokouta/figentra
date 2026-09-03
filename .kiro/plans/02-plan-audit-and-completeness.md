---
status: canonical
created: 2026-09-03
---
# Plan Audit & Completeness

## Objective

Leave exactly one implementation target for every Figentra platform component. Legacy implementation taxonomy must not survive as competing architecture.

## Final domain ownership

| Concern | Canonical owner | Action on old boundary |
|---|---|---|
| Authentication/identity | `@stackra/identity` + Identity service | keep |
| Tenancy | Tenant service | keep |
| Authorization + policies | IAM service | merge Policy |
| Commercial model + entitlements | Monetization service | merge Entitlements |
| Metering | Usage service | keep |
| Orchestration + approvals | Workflow service + `@stackra/workflow` | merge Approval |
| Notifications | Notifications service | keep |
| Audit/governance trail | Audit service | keep separate; no generic Governance service |
| Files | Files service | keep |
| Integrations | Integrations service | keep |
| Search | Search service | keep as service, not package |
| Reporting | Reporting service | keep |
| Analytics | Analytics service | keep |
| Marketing | Marketing service | keep |
| Generic scope hierarchy | none | remove Scope service; product domains own resource hierarchy |

## Canonical service count

**14 services:** Identity, Tenant, IAM, Monetization, Usage, Workflow, Notifications, Audit, Files, Integrations, Search, Reporting, Analytics, Marketing.

## Canonical package coverage

### Base
`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`.

### Capabilities
`identity`, `tracking`.

### Runtime
`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`.

### UI
`router`, `navigation`, `i18n`, `theming`, `ui`.

## Legacy flat-plan migration

Root `.kiro/plans/` is reserved for cross-platform governance/execution documents. Package implementation plans belong under `.kiro/plans/packages/{base,capabilities,runtime,ui}`. Service plans belong under `.kiro/plans/services`. Worker plans belong under `.kiro/plans/workers`. Application plans belong under `.kiro/plans/apps`.

For every dated flat package plan:

1. merge unique implementation detail into the canonical owner;
2. update references to the canonical path and `@stackra/*` namespace;
3. delete the old flat file;
4. do not create aliases, redirects or duplicate copies.

Concerns that are no longer packages are merged into their service/global owner and their flat plans are deleted. Examples: Search/Workflow/Media/Marketing/Notifications become service-owned; Redis becomes Cache; Response/Swagger become HTTP/NestJS concerns; Queue becomes NATS/worker transport; File System becomes Storage.

## Global plans

The following root plans remain intentionally because they govern the whole repository: master platform plan, plan audit, 12-month sequence, enterprise day-one standard, enterprise security/reliability/tenancy/observability plans, global standards, implementation checklist, gap review and PLAN-GOVERNANCE.

## Worker/application boundary

Gateway, Registry and Infrastructure Orchestrator are independent Cloudflare control-plane workers. Service asynchronous processing remains a role of its owning NestJS service. No mirrored `workers/<service>` architecture.

## Infrastructure

Docker and Terraform are mandatory for deployable services and monitoring infrastructure. Development, staging and production use isolated infrastructure state.

## Implementation gates

Validate specs, ownership, contracts, runtime role, security, tenancy, audit, telemetry, migration, reliability, tests and deployment before implementation. Missing design is a spec defect.

## No-deferral gate

No target TODO, fake production driver, architecture placeholder, undocumented compatibility shim, duplicate owner or deliberate post-implementation redesign is allowed.
