# Figentra — Canonical Service Catalog & Review Order

**Status:** Normative inventory
**Count:** 18 deployable bounded-context services

This is the review checklist for the service layer. A service is counted only once. Worker roles are not additional services unless an ADR establishes an independent deployment boundary.

## Services

| # | Service | Spec | Owns | Key consumers/dependencies |
|---|---|---|---|---|
| 01 | Identity | `services/01-identity.md` | authentication orchestration, identities, principals, credentials, sessions, provider links | Gateway, every authenticated service |
| 02 | Tenant | `services/02-tenant.md` | tenants, domains, residency, provisioning, application bindings | Identity, IAM, Scope, commercial services, Gateway |
| 03 | Scope | `services/03-scope.md` | scope hierarchy, memberships, scope context | IAM, Policy, all scope-aware services |
| 04 | IAM | `services/04-iam.md` | permissions, roles, assignments, authorization | every protected service |
| 05 | Policy | `services/05-policy.md` | policies, versions, evaluation context/decisions | IAM, Approval, services needing policy |
| 06 | Approval | `services/06-approval.md` | approval requests, steps, decisions, escalation | IAM/Policy, Workflow, Notifications, Audit |
| 07 | Monetization | `services/07-monetization.md` | products/plans/prices, subscriptions, billing/payment references | Tenant, Entitlements, Usage |
| 08 | Entitlements | `services/08-entitlements.md` | features, grants, limits, effective entitlements | Gateway/services, Monetization, Usage |
| 09 | Usage | `services/09-usage.md` | usage facts, meters, aggregation, quota inputs | all metered services, Monetization, Entitlements |
| 10 | Notifications | `services/10-notifications.md` | templates, preferences, channels, deliveries, provider attempts | Marketing, Workflow, product services |
| 11 | Audit | `services/11-audit.md` | immutable audit records, retention, exports, integrity | all security-sensitive services |
| 12 | Files | `services/12-files.md` | file metadata, upload sessions, object references, processing | product services, Reporting, Integrations |
| 13 | Integrations | `services/13-integrations.md` | external connections, credentials refs, webhooks, sync state | product services, Files, Notifications |
| 14 | Reporting | `services/14-reporting.md` | report definitions/runs, read models, exports | Analytics, Files, product services |
| 15 | Search | `services/15-search.md` | indexes, mappings, indexing jobs, search APIs | product services, Reporting |
| 16 | Workflow | `services/16-workflow.md` | workflow definitions/versions/runs/steps/compensation | Approval, Notifications, Integrations, product services |
| 17 | Analytics | `services/17-analytics.md` | analytical ingestion, facts, dimensions, metrics, attribution, aggregates | Tracking, Reporting, Marketing |
| 18 | Marketing | `services/18-marketing.md` | audiences, campaigns, journeys, activation, conversion | Analytics, Notifications, Entitlements |

## Review order

Review in dependency order:

1. Identity
2. Tenant
3. Scope
4. IAM
5. Policy
6. Approval
7. Monetization
8. Entitlements
9. Usage
10. Notifications
11. Audit
12. Files
13. Integrations
14. Reporting
15. Search
16. Workflow
17. Analytics
18. Marketing

## Supporting runtime components — not services

### Independent Cloudflare Workers

1. Gateway
2. Registry
3. Infrastructure Orchestrator

These are runtime/control-plane components and have their own specs/plans. They do not duplicate the 18 service implementations.

### Runtime roles inside services

API, NATS consumer, ingestion worker, aggregation worker, delivery worker, scheduler, backfill worker and reconciliation worker are roles of the owning service.

## Platform packages — not services

Base packages provide reusable technical capabilities. Identity and Tracking are the only explicitly retained capability packages in the canonical capability layer. Business domains such as Audit, Analytics, Marketing, Notifications, Search, Workflow and Files remain services.

## No extra default services

Do not create separate `auth`, `monitoring`, `telemetry`, `event-bus`, `queue`, `cache`, `media`, `analytics-worker`, `marketing-worker`, `notification-worker`, or `audit-worker` services merely because those words describe a capability. They are owned by the corresponding package/service/runtime role.

## Implementation gate

Before implementation begins for a service, its spec must be reviewed and marked approved. Any missing method, model, endpoint, event, relation, dependency, security rule, migration or worker behavior is a spec defect—not an implementation-time design task.
