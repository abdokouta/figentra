# Cline Rule: Core Architecture

## Mission
Build Figentra as an enterprise-grade platform without unnecessary distributed-system complexity. Prefer strong ownership boundaries, explicit contracts, testable modules, and boring infrastructure over service/package proliferation.

## Non-negotiable ownership
- Identity owns authentication, identity, sessions, credentials/references, principals, provider links, service identities and delegation.
- Tenant owns tenants, organizations, domains, residency, application bindings, provisioning and tenant settings.
- IAM owns permissions, roles, assignments, authorization and policy definitions/evaluation.
- Monetization owns plans/prices, subscriptions, billing, invoices/payments, discounts/credits and commercial entitlements.
- Usage owns usage facts, meters, aggregation, quotas and billable consumption.
- Workflow owns durable workflow orchestration, timers, retries, signals, compensation and human tasks/approvals/escalation; it never owns business state.
- Notifications owns delivery, templates, preferences, channels and provider attempts.
- Audit owns durable governance/audit records and integrity/retention/export.
- Files owns file metadata, upload sessions, object references, versions, lifecycle and processing orchestration.
- Integrations owns external connections, credentials references, OAuth state, webhooks, mappings, sync/import/export and reconciliation.
- Search owns indexes and search lifecycle.
- Reporting owns report definitions, executions, schedules, operational read models and exports.
- Analytics owns analytical ingestion, facts, dimensions, metrics, aggregation, attribution and analytical queries.
- Marketing owns audiences, segments, campaigns, journeys, eligibility, suppression, activation and conversions.

## Do not create boundaries casually
Do not create standalone Scope, Policy, Approval, Entitlement, Governance, Logging, Metrics, Scheduler, Queue, Customer, Configuration, Discovery, or Provider services merely because those concepts exist. Put the capability in its canonical owner unless an ADR proves an independent ownership/lifecycle/deployment boundary.

## Module-first implementation
A business capability is a module. A module is vertically complete and owns its domain/application/infrastructure/presentation/messaging/jobs/schedules concerns. A module is not a microservice by default.

Prefer:
```text
apps/figentra/src/modules/<capability>/
  domain/
  application/
  infrastructure/
  presentation/
  messaging/
  jobs/
  schedules/
  module.ts
```

Do not scatter one module across global `repositories/`, `queues/`, `jobs/`, and `controllers/` directories.

## Runtime versus ownership
Keep these concepts separate:
- Module = ownership boundary.
- Runtime = execution boundary.
- Deployment = infrastructure boundary.

The modular application may expose API, worker/consumer, and scheduler runtimes from the same source tree. A runtime can scale independently without creating a new business service.

## Extraction rule
A module may become a service only when there is a concrete independent ownership, lifecycle, dependency, security, scaling, data, deployment, or release requirement. Extraction must preserve the module's public contracts and tests; do not design speculative microservices.

## Architecture authority
`.kiro/specs/figentra-platform/ARCHITECTURE.md` is normative. `.kiro/plans/` are implementation contracts. If code conflicts with those documents, stop and resolve the contract before implementing.

## Forbidden shortcuts
- No TODO architecture.
- No fake production providers or target shims.
- No duplicate identity/authz stores.
- No cross-module repository/database access.
- No cross-service database writes.
- No raw SQL as a public reporting contract.
- No executable code, secrets, SQL, business data, or provider credentials in Registry metadata.
- No trusting client-supplied identity/tenant/role/permission headers.
