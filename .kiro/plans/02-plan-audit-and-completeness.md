---
status: canonical
created: 2026-09-03
---
# Plan Audit & Completeness — 2026-09-03

## Objective
Close the planning gaps identified by the enterprise day-one review and leave one explicit implementation target for every platform package, service, independent worker and application specification.

## Decisions applied

| Concern | Canonical owner | Rejected duplicate |
|---|---|---|
| Authentication + identity context | `@stackra/identity` + Identity service | standalone `@stackra/auth` |
| Logs | `@stackra/logger` | monitoring package |
| Traces/metrics/OTel | `@stackra/observability` | logger-owned telemetry |
| Behavioral events | `@stackra/tracking` | analytics SDK package |
| Analytical truth | Analytics service | tracking package storage |
| Campaigns/activation | Marketing service | marketing package |
| Delivery | Notifications service | notifications package |
| Immutable audit records | Audit service | audit package implementation |
| Domain implementation | Owning service | generic capability packages |
| Service async work | Owning NestJS service worker/consumer/scheduler role | `workers/<service>` mirror |
| Cross-service protocols | `@stackra/contracts` | service-internal contracts imported by consumers |
| DB lifecycle | `@stackra/database` | ORM-owned connections |
| Mapping/UoW | `@stackra/orm` | database-owned ORM policy |
| Cache | `@stackra/cache` | cache-as-database |
| Monitoring | infrastructure | `@stackra/monitoring` |

## Canonical package plan coverage

### Base
`contracts`, `container`, `support`, `errors`, `config`, `logger`, `observability`, `storage`, `cache`, `database`, `orm`, `schema`, `pagination`, `state-machine`, `pipeline`, `http`, `nats`, `realtime`, `link`.

### Capabilities
`identity`, `tracking`.

### Runtime
`node`, `nestjs`, `browser`, `react`, `react-native`, `desktop`, `worker`.

### UI
`router`, `navigation`, `i18n`, `theming`, `ui`.

Every item above now has a canonical plan under `.kiro/plans/packages/<group>/`.

## Service plan coverage

Canonical services are:
`identity`, `tenant`, `scope`, `iam`, `policy`, `approval`, `monetization`, `entitlements`, `usage`, `notifications`, `audit`, `files`, `integrations`, `reporting`, `search`, `workflow`, `analytics`, `marketing`.

Each has a plan under `.kiro/plans/services/`. Existing service plans remain authoritative and newly missing service plans were added for approval, monetization, entitlements, usage, files, integrations, reporting, search and workflow.

## Independent worker coverage

Only explicitly specified independent workers remain under `.kiro/plans/workers/`: gateway, registry and infrastructure-orchestrator. Audit/analytics/marketing/notifications asynchronous processing is owned by their service roles.

## Application coverage

The application namespace is canonical under `.kiro/plans/apps/` and follows the four current application specifications: Portal, Family, Landing Page and Mobile Application Standard.

## Infrastructure coverage

Docker and Terraform are mandatory planning layers for deployable services and operational monitoring. Environment state is isolated for development, staging and production. Cloudflare Workers remain explicit edge/serverless workloads and are not a generic replacement for NestJS worker roles.

## Required implementation gates

1. Validate the relevant `.kiro/specs` component before coding.
2. Confirm package/service ownership against this audit.
3. Confirm all cross-service protocol changes exist in `@stackra/contracts`.
4. Confirm role, lifecycle, retry, idempotency, readiness and shutdown behavior.
5. Confirm tenant/security/redaction behavior.
6. Confirm telemetry, audit and operational alert coverage.
7. Confirm migration/compatibility behavior.
8. Run unit, integration, contract and end-to-end tests before marking complete.

## No-deferral gate

A plan is not implementation-ready if it contains a target TODO, fake production driver, architecture placeholder, competing owner, undocumented compatibility shim or deliberate post-implementation redesign. Transitional code is permitted only for a named migration boundary with an explicit removal condition.
