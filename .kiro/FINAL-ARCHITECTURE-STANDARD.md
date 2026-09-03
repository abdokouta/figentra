# Figentra — Final Architecture Standard

**Status:** FINAL / NORMATIVE / IMPLEMENTATION LOCKED  
**Date:** 2026-09-03

This document is the final consolidation contract for packages, services, applications and independent Workers. Existing plans are subordinate to this standard. Any contradiction is an architecture defect and must be resolved before implementation.

## 1. Non-negotiable ownership law

```text
Service     = business/domain ownership + durable business state
Package     = reusable technical/cross-runtime capability
Application = product composition and experience
Worker role = async execution role of the owning NestJS service
Edge Worker = explicitly independent Cloudflare workload
Contracts   = cross-service protocol boundary
```

No service writes another service database. No package becomes a shadow business service. No frontend package becomes a second source of truth.

## 2. Canonical 14 services

1. Identity — authentication, principals, sessions, service identities and delegation.
2. Tenant — tenants, organizations, memberships, domains, provisioning and tenant settings.
3. IAM — roles, permissions, assignments and authorization.
4. Monetization — plans, prices, subscriptions, billing, invoices, payments, credits and commercial entitlements.
5. Usage — meters, usage facts, aggregation, periods, quotas and billable consumption.
6. Workflow — definitions, executions, steps, timers, retries, compensation, signals, human tasks, approvals and escalation.
7. Notifications — templates, preferences, channel routing, deliveries and provider attempts.
8. Audit — immutable accountability records, retention, integrity and export.
9. Files — file metadata, upload sessions, object references, versions, lifecycle and processing orchestration.
10. Integrations — external connections, OAuth state, credential references, webhooks, mappings, imports/exports and reconciliation.
11. Search — indexes, mappings, projections, query execution and reindexing.
12. Reporting — datasets, report definitions/revisions, execution, schedules, read models and exports.
13. Analytics — facts, dimensions, metrics, aggregation, attribution and analytical queries.
14. Marketing — audiences, segments, campaigns, journeys, eligibility, suppression, activation and conversion.

Removed boundaries remain removed: Scope, Policy, Approval and Entitlements are not services.

## 3. Identity / Tenant / Scope / IAM

Authentication is not tenancy and tenancy is not authorization.

```text
Identity
  who am I?
  principal + session + authentication

Tenant
  which organizations/tenants exist?
  memberships + lifecycle + domains

@stackra/scope
  which tenant/workspace/resource context is currently selected?
  client context + switchers + hooks + propagation

IAM
  may this principal perform this action here?
```

`@stackra/identity` may carry trusted tenant context but never owns tenant lifecycle. `@stackra/scope` is a client/context capability, not a tenant database abstraction. Server authorization always resolves trusted RequestContext and IAM; client switchers are UX state only.

## 4. Package boundary law

Default rule:

```text
CAPABILITY            = PACKAGE
PROVIDER / DRIVER     = SUBPATH
RUNTIME INTEGRATION   = SUBPATH
FRAMEWORK INTEGRATION = SUBPATH
HTTP TRANSPORT        = SUBPATH
TESTING               = SUBPATH
```

A standalone package requires an independent ownership/lifecycle/release/dependency/runtime boundary. Do not create packages solely for Redis, Axios, Elasticsearch, email, Slack, encryption, hashing, response, network, session, tracing or similar implementation details when they belong under an existing capability.

## 5. Canonical package taxonomy

### Base

```text
contracts
container
support
errors
config
logger
observability
storage
cache
 database
orm
schema
pagination
state-machine
pipeline
http
nats
realtime
link
events
security
coordinator
health
```

### Capabilities

```text
identity
scope
tracking
workflow
sync
queue
query
state
media
search
reporting
dashboard
audit
sdui
page-builder
seo
scheduler
pwa
kbd
ai
collaboration
consent
webhook
```

### Runtime foundations

```text
node
nestjs
browser
react
react-native
desktop
worker
```

### Tooling/UI

```text
build
testing
console
swagger/openapi
router
navigation
i18n
theming
ui
```

### Canonical subpath placements

```text
@stackra/cache/redis
@stackra/security/encryption
@stackra/security/hashing
@stackra/security/csp
@stackra/http/network
@stackra/http/response
@stackra/http/rate-limit
@stackra/http/cookie
@stackra/identity/session
@stackra/notifications/email
@stackra/notifications/slack
@stackra/observability/tracing
@stackra/search/indexer
@stackra/nats/pubsub
@stackra/contracts/versioning
```

`desktop`, `pwa`, `kbd` and other names remain packages only where their runtime/consumer boundary is independently useful; otherwise they are runtime-specific subpaths as defined by the package coverage matrix.

## 6. Mandatory package plan contract

Every canonical package plan MUST define:

```text
frontmatter
status + ownership
purpose + non-goals
package/dependency graph
exact package directory
exact source tree
all subpath exports
public types/interfaces/classes/functions/constants
method signatures and semantics
DI/provider tokens
manager/factory/adapter roles
provider/driver matrix
configuration schema
runtime matrix
lifecycle/start/stop behavior
discovery/registry behavior
security and secret handling
tenancy/isolation
caching
errors + retryability + cancellation
concurrency + resource limits
observability/logs/metrics/traces
persistence/migrations if applicable
HTTP/events/queue integration
testing tree and conformance suites
real-provider acceptance
compatibility/versioning
implementation phases
exit criteria
```

A package plan is incomplete if a developer must invent any of those boundaries during coding.

## 7. Mandatory service module contract

Every service plan MUST enumerate every module and its exact files. At module level the plan must identify:

```text
module path
aggregate/entities/value objects
commands + handlers
queries + handlers
application services
repositories/ports
provider adapters
controllers
routes + HTTP methods
request/response DTOs
validation
IAM permissions
Tenant/RequestContext requirements
database tables + indexes
migrations
published events
consumed events
NATS subjects
queue jobs + handlers
retry/backoff/DLQ policy
scheduler entries
email requests
authorized Slack/notification requests
webhook interactions
idempotency keys
outbox records
reconciliation jobs
health/readiness dependencies
metrics + traces + audit events
unit/integration/contract/E2E/load/security tests
```

If a category is not applicable, the plan must explicitly say `N/A` and why.

## 8. NestJS runtime standard

NestJS is the canonical Node service framework. One service source tree provides role entrypoints:

```text
src/main.ts                 API
src/consumer.ts             durable event consumer
src/worker.ts               durable job worker
src/scheduler.ts            scheduled execution
src/modules/**              shared service modules
```

Do not create `workers/<service>` copies of the service unless an ADR establishes a genuinely independent deployment/runtime boundary.

## 9. Controller standard

Controllers are transport adapters only. They validate DTOs, establish RequestContext, invoke application commands/queries and map typed results/errors to HTTP. Controllers do not contain domain logic, direct provider calls or database queries.

Factory-based controllers are preferred when route/path configuration is configurable; route definitions remain explicit and OpenAPI-generated.

## 10. Async standard

```text
transaction
 → outbox
 → NATS JetStream
 → consumer
 → idempotent handler
 → side effect
 → durable result/event
```

Jobs require stable job identity, occurrence/attempt identity, bounded concurrency, timeout, retry policy, DLQ behavior and reconciliation. Delayed work belongs to scheduler/queue semantics, not ad-hoc `setTimeout`.

## 11. Email / Slack / notification standard

Business services do not import provider SDKs directly.

```text
Business event/command
 → Notifications request contract
 → template/preferences/channel policy
 → provider adapter
 → delivery attempt
 → status event
```

Email and Slack are provider channels under Notifications. Provider SDKs remain behind adapters. Durable delivery records and attempts belong to Notifications.

## 12. Search standard

```text
Domain DB
 → outbox/event
 → Search consumer/indexer
 → provider adapter
 → versioned index

React/RN
 → typed Search HTTP client
 → Gateway
 → Search API
 → authorization + query compiler
 → provider
 → normalized SearchResult
```

Frontend/mobile never import a search-engine SDK. Search documents are projections, never business truth. Rebuilds use versioned indexes and atomic alias cutover. Meilisearch/Elasticsearch/Algolia are adapters, not architectural boundaries.

## 13. Reporting standard

Reports are typed definitions over approved datasets. Custom reports may select registered fields, filters, grouping, aggregation and allow-listed calculated expressions. Raw SQL, arbitrary joins and database/provider DSL never cross the client boundary.

One report definition powers preview, execution, dashboard widgets, export and schedules. Expensive execution becomes a durable job. Exports go through Files/object storage and return revocable signed references.

## 14. Dashboard standard

Dashboard is a reusable document/layout/widget capability, not a service. Persistence belongs to the host application/service through `@stackra/dashboard/nestjs`. Revisions are immutable; publish/rollback is explicit; widgets consume typed report/search/domain data contracts.

## 15. SDUI / Page Builder standard

```text
Page Builder editor
 → typed document AST
 → SDUI schema validation
 → owning service draft/revision
 → publish
 → runtime SDUI document
 → React/RN renderer
```

Never persist DOM coordinates or serialized React trees as the canonical document. No arbitrary executable JavaScript, SQL, unrestricted URLs or component code may be transported.

## 16. SEO standard

SEO resolves authoritative domain/page revisions into a typed document used by NestJS, React SSR/CSR, canonical/hreflang, robots, OpenGraph/Twitter, JSON-LD and sitemap generation. SEO is not a standalone service or Worker. Public artifacts are revision-aware and safely cached.

## 17. Events / tracking / analytics / audit / usage

```text
Events     = business facts
Tracking   = behavioral collection
Analytics  = analytical interpretation
Audit      = accountability record
Usage      = metering
```

No system may silently use one signal type as another.

## 18. HTTP / contracts

HTTPS + OpenAPI is the synchronous service contract. `@stackra/contracts` owns cross-service DTOs, schemas, commands, queries, events, errors and protocol interfaces. Service implementations, ORM entities and providers never cross the boundary.

## 19. Storage / cache / database / ORM

Storage abstracts files/object/key-value/secure storage. Cache is disposable and tenant/authorization scoped. Database owns connections/transactions/migrations/health. ORM owns metadata/repositories/UoW/identity map/locking and filters. Cache never becomes persistence.

## 20. Security

Identity authenticates. IAM authorizes. Monetization checks commercial availability. Tenant establishes trusted context. Security packages provide primitives. CSP/cookie/session behavior is explicit. Secrets never enter source, ordinary logs, client bundles or untrusted documents.

## 21. Observability

```text
logger       → logs
observability→ OTel traces/metrics/propagation
health       → application dependency health/readiness
monitoring   → operational infrastructure/SLOs/alerts
```

Every asynchronous operation carries correlation/trace context. Sensitive payloads are redacted.

## 22. Environments and deployment

Exactly:

```text
development
staging
production
```

Docker is the service runtime boundary. Terraform is infrastructure source of truth. Configuration is schema-validated and environment-specific. Production startup fails closed on required missing configuration.

## 23. Testing gate

Every package/service requires, as applicable:

```text
unit
integration
contract
adapter conformance
real-provider E2E
security
failure/recovery
concurrency/load
runtime lifecycle
HTTP/OpenAPI
migration/rollback
```

Mock-only acceptance is prohibited for provider-backed production capabilities.

## 24. Documentation hygiene

There must be one canonical plan per package/service. Historical dated plans are either merged into the canonical plan or explicitly marked superseded and removed. No duplicate aliases, compatibility target shims or contradictory architecture documents may remain.

## 25. Final implementation gate

Before coding a package/service/application module, the repository must answer:

```text
Who owns it?
Where are the exact files?
What are every public export and method?
What enters/leaves HTTP/events/queues?
Which DB tables and indexes exist?
Which jobs/schedulers exist?
Which email/notification effects exist?
How is tenant/IAM enforced?
What retries and failure states exist?
How is it observed?
How is it tested with real dependencies?
How is it migrated and rolled back?
What is explicitly NOT allowed?
```

If any answer is missing, implementation is blocked and the plan must be extended first.

## 26. Final decision

This architecture is the implementation baseline for Figentra. Future additions must extend an existing ownership boundary or be justified by an ADR. New services, Workers, packages, provider-specific packages and alternate runtime architectures are not introduced by implementation convenience.
