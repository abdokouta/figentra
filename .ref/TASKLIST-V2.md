# Figentra V2 Task List

## Operating rule

**Phase 0 must be completed before implementation begins.**

Every architecture decision must have an accepted ADR and every engineering
convention must have a standards document before downstream implementation is
marked complete.

Status:
- `[x]` completed
- `[ ]` pending
- `[~]` external-environment gate or requires real account/infrastructure
- `[?]` decision still required

---

# PHASE 0 — Architecture Decisions and Standards — GATE

## ADRs

- [x] Runtime foundation ADR
- [x] Service-to-service communication ADR
- [x] Event contracts/versioning ADR
- [x] Transactional outbox ADR
- [x] Identity/IAM boundary ADR
- [x] Principal/actor model ADR
- [x] Dynamic scope ADR
- [x] Application Registry ADR
- [x] Gateway/edge ADR
- [x] Infrastructure Orchestrator ADR
- [x] Cloud/infrastructure boundary ADR
- [x] Database/ORM ADR
- [x] Feature flags/integrations ADR
- [x] Monetization ADR
- [x] Notifications ADR
- [x] Search/reporting ADR
- [x] API/webhook/event/package versioning ADR
- [x] Workflow ADR
- [x] UI architecture ADR
- [x] Source organization ADR
- [x] Testing/quality ADR
- [x] Observability/audit ADR
- [x] Security model ADR
- [x] Environment model ADR

## Standards

- [x] Architecture standard
- [x] TypeScript standard
- [x] package.json standard
- [x] catalog.json standard
- [x] test layout standard
- [x] documentation/TSDoc standard
- [x] environment standard
- [x] YAML standard
- [x] NestJS service standard
- [x] Worker standard
- [x] Terraform standard
- [x] security standard
- [x] API contract standard
- [x] event contract standard
- [x] database standard

## Phase 0 gate

- [ ] Review all ADRs with implementation owners
- [ ] Resolve any conflicting ADRs
- [ ] Freeze V2 architecture baseline
- [ ] Approve standards as mandatory repository rules


## PHASE 0.5 — Infrastructure Layout Standardization

- [x] Move Docker environments under `infrastructure/docker/environments`
- [x] Move PostgreSQL support under `infrastructure/docker/postgres`
- [x] Move PostgreSQL migrations under `infrastructure/docker/postgres/migrations`
- [x] Move Docker scripts under `infrastructure/docker/scripts`
- [x] Keep Terraform scripts under `infrastructure/terraform/scripts`
- [x] Standardize generated Compose output as `infrastructure/docker/docker-compose.generated.yml`
- [x] Reserve `catalog.json` for reusable Stackra packages
- [x] Add Docker infrastructure catalog as `infrastructure/docker/catalog.yaml`
- [x] Remove `.gitkeep` from directories containing real files
- [x] Document infrastructure ownership boundaries

---


## PHASE 0.6 — Single Deployment Catalog

- [x] Remove per-deployable Terraform directories
- [x] Remove deployable-specific Terraform generator
- [x] Move shared cloud catalog collector to `infrastructure/scripts`
- [x] Generate canonical `infrastructure/catalog.json`
- [x] Make Terraform consume canonical catalog
- [x] Make Docker consume canonical catalog
- [x] Keep generated Compose under `infrastructure/docker`
- [x] Add Docker Compose validation
- [x] Document catalog ownership and source-of-truth rules

# PHASE 1 — Runtime Foundation

- [ ] Finalize Node.js 24 runtime
- [ ] Finalize NestJS + Fastify
- [ ] Finalize SWC
- [ ] Finalize Pino logging
- [ ] Configuration schema validation
- [ ] Graceful shutdown
- [ ] Health/live/readiness contracts
- [ ] Request ID
- [ ] Correlation ID
- [ ] Trace propagation
- [ ] Error contract
- [ ] Standard service bootstrap
- [ ] Standard Worker bootstrap
- [ ] Standard Vite bootstrap

---

# PHASE 2 — Repository and Package Platform

- [ ] Finalize pnpm workspace
- [ ] Finalize npm overrides
- [ ] Finalize Turbo pipelines
- [ ] Standardize every `@stackra/*` package
- [ ] Standardize package.json
- [ ] Standardize exports
- [ ] Standardize peer dependencies
- [ ] Standardize optional peer dependencies
- [ ] Standardize dev dependencies
- [ ] Standardize catalog.json
- [ ] Standardize Stackra TypeScript config
- [ ] Standardize Stackra tsup config
- [ ] Standardize Stackra testing config
- [ ] Remove stale ESLint/Jest references
- [ ] Oxlint repository gate
- [ ] Prettier repository gate
- [ ] Package/catalog consistency validator
- [ ] Package/export consistency validator

---

# PHASE 3 — Testing Platform

- [ ] Standard Vitest config
- [ ] Standard `__tests__` layout
- [ ] Standard `vitest.setup.ts`
- [ ] Unit testing conventions
- [ ] Integration testing conventions
- [ ] E2E testing conventions
- [ ] Test fixtures conventions
- [ ] Test database strategy
- [ ] Test NATS strategy
- [ ] Worker binding test strategy
- [ ] Browser E2E strategy
- [ ] Coverage policy
- [ ] CI test gate

---

# PHASE 4 — Identity

- [ ] Final Supabase Auth integration
- [ ] JWT contract
- [ ] JWKS issuer contract
- [ ] Token validation
- [ ] Service identity
- [ ] Service-account credentials
- [ ] API keys
- [ ] M2M OAuth
- [ ] Token exchange
- [ ] Delegation/impersonation
- [ ] Identity lifecycle
- [ ] Account linking
- [ ] SSO/SAML
- [ ] SCIM lifecycle
- [ ] Identity deletion
- [ ] Provider migration
- [ ] Supabase webhook handling
- [ ] Identity events
- [ ] Identity database schema

---

# PHASE 5 — IAM + Scope

- [ ] Final principal model
- [ ] Human principal
- [ ] Machine/service principal
- [ ] Actor semantics
- [ ] Role model
- [ ] Permission model
- [ ] Policy model
- [ ] Policy language
- [ ] Policy evaluator
- [ ] Authorization API
- [ ] Nest authorization guard/interceptor
- [ ] Worker authorization middleware
- [ ] Service authorization
- [ ] Delegated authorization
- [ ] Authorization cache
- [ ] Authorization latency SLO
- [ ] Deny-by-default enforcement
- [ ] Dynamic Scope model
- [ ] Scope inheritance
- [ ] Scope propagation
- [ ] Scope-aware database access
- [ ] IAM audit

---

# PHASE 6 — Service Communication

- [ ] NATS production topology
- [ ] NATS TLS
- [ ] NATS credentials
- [ ] NATS accounts/subjects
- [ ] Nest NATS adapter
- [ ] Message envelope
- [ ] Internal RPC contract
- [ ] Event contract package
- [ ] Event registry
- [ ] Request/reply convention
- [ ] Retry policy
- [ ] Backoff policy
- [ ] DLQ
- [ ] Idempotency
- [ ] Correlation/causation propagation
- [ ] Service identity propagation

---

# PHASE 7 — Transactional Outbox

- [ ] MikroORM transaction standard
- [ ] Outbox schema
- [ ] Outbox repository
- [ ] Relay
- [ ] Retry
- [ ] DLQ
- [ ] Deduplication
- [ ] Replay
- [ ] Poison message handling
- [ ] Relay observability
- [ ] Outbox backlog SLO

---

# PHASE 8 — Gateway + Registry

## Gateway

- [ ] Authentication
- [ ] IAM authorization
- [ ] Request/correlation/trace propagation
- [ ] CORS
- [ ] Security headers
- [ ] WAF
- [ ] Rate limiting
- [ ] Registry Service Binding
- [ ] Route resolution
- [ ] Service authentication
- [ ] Token exchange
- [ ] Timeout
- [ ] Retry policy
- [ ] Circuit breaker
- [ ] Upstream health
- [ ] Gateway audit
- [ ] Integration tests
- [ ] Load tests
- [ ] Failure tests

## Registry

- [ ] Application registration
- [ ] Application versioning
- [ ] Environment metadata
- [ ] Route registry
- [ ] Module registry
- [ ] Resource registry
- [ ] Action registry
- [ ] Permission registry
- [ ] Event registry
- [ ] Integration registry
- [ ] Workflow registry
- [ ] Health registry
- [ ] Capability registry
- [ ] Branding/theme metadata
- [ ] D1 migrations
- [ ] KV cache
- [ ] Cache invalidation
- [ ] CI/service-principal authentication
- [ ] Registration authorization
- [ ] SSRF protection
- [ ] Registry audit
- [ ] Integration tests
- [ ] Load tests
- [ ] Failure tests

---

# PHASE 9 — Tenant and Dynamic Business Context

- [ ] Tenant service
- [ ] Tenant lifecycle
- [ ] Organization support
- [ ] Membership
- [ ] Dynamic hierarchy mapping
- [ ] Scope assignment
- [ ] Tenant isolation
- [ ] Tenant settings
- [ ] Tenant suspension
- [ ] Tenant deletion
- [ ] Domain association
- [ ] Custom domains
- [ ] Domain verification
- [ ] TLS/SSL lifecycle

---

# PHASE 10 — Monetization

- [ ] Monetization service
- [ ] Products
- [ ] Plans
- [ ] Subscriptions
- [ ] Billing
- [ ] Invoices
- [ ] Payments
- [ ] Stripe adapter
- [ ] Paddle adapter
- [ ] Entitlements
- [ ] Meter definitions
- [ ] Usage ingestion
- [ ] Quotas
- [ ] Usage aggregation
- [ ] Provider webhooks
- [ ] Reconciliation
- [ ] Failed payment lifecycle
- [ ] Billing audit

---

# PHASE 11 — Notifications

- [ ] Notification service
- [ ] Email
- [ ] React Email templates
- [ ] Template versioning
- [ ] Localization
- [ ] SMS
- [ ] Push
- [ ] In-app
- [ ] Webhooks
- [ ] Preferences
- [ ] Suppression
- [ ] Provider adapters
- [ ] Retry
- [ ] DLQ
- [ ] Delivery tracking
- [ ] Notification events

---

# PHASE 12 — Integrations / App Marketplace

- [ ] Integration Registry
- [ ] Provider definitions
- [ ] Tenant installations
- [ ] OAuth configuration
- [ ] API credentials
- [ ] Configuration schemas
- [ ] Activation/deactivation
- [ ] Provider scopes
- [ ] Entitlement requirements
- [ ] Feature flags
- [ ] Webhook subscriptions
- [ ] Integration health
- [ ] Integration audit

---

# PHASE 13 — Search / Reporting / Facts

- [ ] Search service
- [ ] Search contract
- [ ] Search index registry
- [ ] Projection pipeline
- [ ] PostgreSQL search
- [ ] Meilisearch/OpenSearch decision per workload
- [ ] Report Registry
- [ ] Fact Registry
- [ ] Metric Registry
- [ ] Dimensions
- [ ] Measures
- [ ] Report definitions
- [ ] Scheduled reports
- [ ] Export jobs
- [ ] Analytics retention
- [ ] Reporting permissions

---

# PHASE 14 — API / Webhook / Versioning Platform

- [ ] API version registry
- [ ] Webhook version registry
- [ ] Event schema registry
- [ ] Deprecation policy
- [ ] Compatibility testing
- [ ] Consumer migration policy
- [ ] SDK generation policy
- [ ] Public API documentation
- [ ] Webhook signing
- [ ] Webhook replay
- [ ] Webhook idempotency

---

# PHASE 15 — Workflow Platform

- [ ] Workflow definition contract
- [ ] Workflow registry
- [ ] Step contract
- [ ] Retry semantics
- [ ] Idempotency
- [ ] Compensation
- [ ] Timeout
- [ ] Cancellation
- [ ] Workflow state
- [ ] Workflow audit
- [ ] Workflow observability

---

# PHASE 16 — Infrastructure Orchestrator

- [ ] Orchestrator API
- [ ] IAM authorization
- [ ] Approval/change reference
- [ ] D1 state
- [ ] Cloudflare Workflow
- [ ] Container Terraform runner
- [ ] Exact Git SHA execution
- [ ] Fixed Terraform root
- [ ] Fixed operation allowlist
- [ ] Egress allowlist
- [ ] Scoped cloud credentials
- [ ] Concurrency lock
- [ ] Idempotency
- [ ] Plan
- [ ] Apply
- [ ] Destroy protection
- [ ] Rollback
- [ ] Audit
- [ ] Job retention

## Real infrastructure gate

- [~] Terraform provision real Orchestrator D1/Workflow/Container
- [~] Configure production runner secrets
- [~] Run real development plan
- [~] Run real staging plan/apply
- [~] Execute rollback drill
- [~] Production approval/change test
- [~] Production apply

---

# PHASE 17 — Cloudflare Production

- [ ] WAF policy
- [ ] Rate-limit namespaces
- [ ] Worker bindings
- [ ] Service Bindings
- [ ] D1
- [ ] KV
- [ ] R2 where required
- [ ] Queues where required
- [ ] Durable Objects where required
- [ ] Containers where required
- [ ] Workflows
- [ ] DNS
- [ ] Custom domains
- [ ] TLS
- [ ] Observability
- [ ] Log retention
- [ ] Incident alerts

---

# PHASE 18 — Applications

## Portal

- [ ] Vite
- [ ] React 19
- [ ] HeroUI 3
- [ ] Tailwind 4
- [ ] React Router 7
- [ ] Stackra HTTP
- [ ] Stackra Query/State where available
- [ ] Registry integration
- [ ] Branding
- [ ] Feature flags
- [ ] Permissions-aware UI
- [ ] Resource UI
- [ ] Tests

## Landing Page

- [ ] Vite
- [ ] React 19
- [ ] HeroUI 3
- [ ] Tailwind 4
- [ ] Router
- [ ] SEO
- [ ] Tests

---

# PHASE 19 — Registry Scanners / Code Generation

- [ ] Application scanner
- [ ] Resource scanner
- [ ] Action scanner
- [ ] Permission scanner
- [ ] Event scanner
- [ ] Workflow scanner
- [ ] Route scanner
- [ ] Health scanner
- [ ] Integration scanner
- [ ] Decorator metadata extraction
- [ ] Deterministic generation
- [ ] Generated artifact validation
- [ ] CI drift detection

---

# PHASE 20 — Enterprise Quality Gate

- [ ] Full monorepo build
- [ ] Full typecheck
- [ ] Full Oxlint
- [ ] Full Prettier check
- [ ] Full unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Contract tests
- [ ] NATS failure tests
- [ ] Outbox failure tests
- [ ] Gateway load tests
- [ ] Registry load tests
- [ ] Security tests
- [ ] DAST
- [ ] Dependency scan
- [ ] Container scan
- [ ] Secret scan
- [ ] License scan
- [ ] Terraform validation
- [ ] Terraform plan policy
- [ ] Docker build verification
- [ ] Deployment rehearsal
- [ ] Disaster recovery rehearsal
- [ ] Rollback rehearsal
- [ ] Backup/restore test
- [ ] SLO verification
- [ ] Alerting verification
- [ ] Production change-control verification
- [ ] Final production approval

---

# V2 Completion Rule

V2 is not considered complete because files exist.

A task is complete only when:

1. The implementation exists.
2. The corresponding standard/ADR exists where architectural.
3. Automated validation exists where practical.
4. Tests cover the behavior.
5. Documentation is updated.
6. CI passes.
7. Real infrastructure gates are verified where required.

External infrastructure tasks remain `[~]` until executed against the actual
environment.


## PHASE 4.5 — Worker D1 Migration Standard

- [x] One logical table per SQL migration
- [x] Table constraints colocated with table migration
- [x] Table access indexes colocated with table migration
- [x] Explicit rollback companion SQL
- [x] Wrangler remains the production migration runner
- [x] Knex rejected for Worker D1 migrations
- [x] Registry schema split into ordered migrations
- [x] Infrastructure Orchestrator schema normalized
- [x] D1 migration ADR added
- [x] Migration README/runbook added
## Batch K — NestJS Observe + Devtools Standardization

- [x] Research current official NestJS Observe SDK
- [x] Research official NestJS Devtools integration
- [x] Create shared `@figentra/observability/nest` package
- [x] Add Observe instrumentation to all NestJS services
- [x] Add explicit Devtools integration to all NestJS services
- [x] Disable Devtools HTTP introspection by default
- [x] Add stable `OBSERVE_SERVICE_ID` per service
- [x] Define runtime Observe secret contract
- [x] Define release/service version telemetry contract
- [x] Add Nest Observe/Devtools ADR
- [x] Update Nest runtime standards
- [x] Document Observe MCP as an external read-only operator interface
- [ ] Provision Observe project/app keys for development
- [ ] Provision Observe project/app keys for staging
- [ ] Provision Observe project/app keys for production
- [ ] Configure production `OBSERVE_SERVICE_VERSION` from immutable Git SHA
- [ ] Enable official Devtools GraphPublisher in CI when Enterprise plan/API key is available
- [ ] Verify telemetry in staging
- [ ] Verify telemetry in production

## Batch OBS — Unified Observability / Logging / Telemetry

- [x] Consolidate observability packages into `@figentra/observability`.
- [x] Add `/contracts`, `/core`, `/nest`, `/worker`, `/testing` subpath exports.
- [x] Standardize all 16 Nest services on `nestjs-pino`.
- [x] Standardize request/correlation IDs and log redaction.
- [x] Standardize NestJS Observe integration.
- [x] Standardize Nest Devtools integration.
- [x] Standardize all 3 Hono Workers on Hono/Pino.
- [x] Prohibit Node-only Pino transports in Cloudflare Workers.
- [x] Add Stackra logger/container dependencies to Vite and Expo apps.
- [x] Bootstrap Stackra container in Vite and Expo applications.
- [x] Separate technical observability from Audit Service semantics.
- [x] Document runtime logging/telemetry/security boundaries.
- [x] Add ADR-0053.

## Batch AUDIT — Enterprise Audit Service

- [x] Create per-worker `plan.md` documentation for Gateway, Registry, and Infrastructure Orchestrator.
- [x] Define Audit Service purpose, ownership, runtime, API, integrity, retention, and remaining gates.
- [x] Select MikroORM 7 + PostgreSQL as the Audit persistence standard.
- [x] Add MikroORM/Nest integration.
- [x] Add explicit SQL migration with `up()` and `down()`.
- [x] Add append-only audit entity.
- [x] Add tenant/actor/action/resource/outcome/time query model.
- [x] Add tamper-evident per-stream SHA-256 hash chaining.
- [x] Add transaction-scoped PostgreSQL advisory locking.
- [x] Add versioned internal audit HTTP API.
- [x] Add input validation and bounded pagination.
- [x] Add service identity authentication boundary.
- [x] Add IAM authorization permissions `audit.write` and `audit.read`.
- [x] Add NATS audit event contract.
- [x] Add NATS audit event consumer.
- [x] Add event-ID idempotency uniqueness constraint.
- [x] Add unit coverage for hash chaining.
- [x] Add external-dependency-safe health-test setup.
- [x] Add ADR-0054.
- [ ] Verify npm dependency resolution with the real repository registry.
- [ ] Run real PostgreSQL integration tests.
- [ ] Run real NATS integration tests.
- [ ] Create restricted PostgreSQL audit writer/read roles.
- [ ] Implement retention/legal-hold/archival workflow.
- [ ] Implement hash-chain verification job.
- [ ] Implement authorized export.
- [ ] Run load/soak/security/penetration tests.
- [ ] Run backup/PITR and disaster-recovery rehearsal.
