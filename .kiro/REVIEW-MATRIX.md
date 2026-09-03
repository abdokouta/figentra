# Figentra — Architecture Review Matrix

**Purpose:** Single checklist for human review before implementation.
**Canonical service count:** 18
**Canonical package count:** 33
**Independent Cloudflare worker count:** 3
**Application count in current architecture:** 3

## Review sequence

### A. Platform contracts

- [ ] `specs/figentra-platform/README.md`
- [ ] `specs/figentra-platform/ARCHITECTURE.md`
- [ ] `specs/figentra-platform/messaging.md`
- [ ] `specs/figentra-platform/00-implementation-checklist.md`
- [ ] `specs/figentra-platform/00-service-contract.md`
- [ ] `specs/figentra-platform/SERVICE-CATALOG.md`

### B. Services — 18

| # | Component | Specification | Review |
|---|---|---|---|
| 01 | Identity | `services/01-identity.md` | [ ] |
| 02 | Tenant | `services/02-tenant.md` | [ ] |
| 03 | Scope | `services/03-scope.md` | [ ] |
| 04 | IAM | `services/04-iam.md` | [ ] |
| 05 | Policy | `services/05-policy.md` | [ ] |
| 06 | Approval | `services/06-approval.md` | [ ] |
| 07 | Monetization | `services/07-monetization.md` | [ ] |
| 08 | Entitlements | `services/08-entitlements.md` | [ ] |
| 09 | Usage | `services/09-usage.md` | [ ] |
| 10 | Notifications | `services/10-notifications.md` | [ ] |
| 11 | Audit | `services/11-audit.md` | [ ] |
| 12 | Files | `services/12-files.md` | [ ] |
| 13 | Integrations | `services/13-integrations.md` | [ ] |
| 14 | Reporting | `services/14-reporting.md` | [ ] |
| 15 | Search | `services/15-search.md` | [ ] |
| 16 | Workflow | `services/16-workflow.md` | [ ] |
| 17 | Analytics | `services/17-analytics.md` | [ ] |
| 18 | Marketing | `services/18-marketing.md` | [ ] |

Every service review must verify: ownership, module tree, entities, columns/constraints/indexes, DTOs, commands/queries, interfaces/methods, controllers/routes, OpenAPI, NATS subjects/events, outbox, consumers/workers, providers/adapters, Identity/IAM/Tenant/Scope/Entitlement calls, errors, configuration, security, observability, idempotency, retries/DLQ, migrations, tests, deployment and rollback.

### C. Base packages — 19

- [ ] contracts
- [ ] container
- [ ] support
- [ ] errors
- [ ] config
- [ ] logger
- [ ] observability
- [ ] storage
- [ ] cache
- [ ] database
- [ ] orm
- [ ] schema
- [ ] pagination
- [ ] state-machine
- [ ] pipeline
- [ ] http
- [ ] nats
- [ ] realtime
- [ ] link

### D. Capability packages — 2

- [ ] identity
- [ ] tracking

### E. Runtime packages — 7

- [ ] node
- [ ] nestjs
- [ ] browser
- [ ] react
- [ ] react-native
- [ ] desktop
- [ ] worker

### F. UI packages — 5

- [ ] router
- [ ] navigation
- [ ] i18n
- [ ] theming
- [ ] ui

### G. Independent workers — 3

- [ ] gateway
- [ ] registry
- [ ] infrastructure-orchestrator

### H. Applications — 3

- [ ] portal
- [ ] landing-page
- [ ] family

## Mandatory architecture invariants

- [ ] Identity owns authentication and principal normalization.
- [ ] IAM/Policy own authorization; Identity does not.
- [ ] Tenant/Scope provide context; they do not replace IAM.
- [ ] Monetization/Entitlements own commercial access.
- [ ] Services own their own databases.
- [ ] No cross-service database writes or foreign keys.
- [ ] `@stackra/contracts` owns cross-service protocol contracts.
- [ ] NATS + JetStream is the canonical durable message bus.
- [ ] Redis is cache/coordination, not durable business events.
- [ ] Kafka requires ADR and is not default infrastructure.
- [ ] Durable events use transactional outbox.
- [ ] Workers are roles of their owning services unless independently justified.
- [ ] Logger, Observability, Tracking, Analytics and Audit remain distinct.
- [ ] Docker + Terraform are the infrastructure baseline.
- [ ] Development, staging and production are isolated.
- [ ] No implementation begins with unresolved architectural TODOs.

## Final gate

All checkboxes must be reviewed and all architectural decisions accepted before implementation is considered unblocked. A rejected item becomes a concrete document/ADR change; it is not deferred into implementation.
