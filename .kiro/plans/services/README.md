# Service Plans

Services are the sole owners of business/domain implementations in Figentra. Implementation lives under `services/<service>/src/modules` and follows `.kiro/specs/figentra-platform/services/*`.

## Canonical services
1. Identity
2. Tenant
3. IAM
4. Monetization
5. Usage
6. Workflow
7. Notifications
8. Audit
9. Files
10. Integrations
11. Search
12. Reporting
13. Analytics
14. Marketing

Retired standalone boundaries: Scope → Tenant/IAM context; Policy → IAM; Approval → Workflow; Entitlements → Monetization.

## Runtime
Each service may expose `api`, `consumer`, `worker` and `scheduler` roles from the same NestJS source tree. A mirrored `workers/<service>` implementation is forbidden unless an ADR proves an independent deployment boundary.

## Required per-module implementation detail
Every service plan must enumerate, for every module, exact source files and:
```text
entities/value objects/invariants
commands + application methods
queries + read methods
repository ports + adapters
controllers + routes + DTOs + authz
emitted/consumed event schemas
queue subjects/streams
jobs + handlers + payload + retry/DLQ/timeout
scheduler entries + occurrence/idempotency policy
notification/email/Slack request contracts
persistence tables + indexes + migrations
tenancy/IAM rules
audit hooks
health/readiness impact
metrics/traces/logging
unit/integration/contract/security/E2E/load tests
deployment/runtime configuration
```
The complete canonical matrix is `.kiro/plans/2026-09-03-service-implementation-contract.md`.

## Contracts
Cross-service DTOs, commands, queries, events and errors are versioned in `@stackra/contracts`. Consumers never import another service's implementation, ORM entities, repositories or providers.

## Workflow
`@stackra/workflow` is the reusable workflow definition/execution-client SDK. The Workflow service owns durable execution, timers, retries, compensation, human tasks and approvals. Business services define workflows with the SDK and expose the business commands/events they execute.

## Authorization
Identity answers who is authenticated. Tenant owns tenancy. IAM answers whether the principal may act. Policy is part of IAM. Monetization provides commercial entitlement decisions. Services do not implement private authorization systems.

## Notifications
Business services never call SMTP, SES, SendGrid, Slack, SMS or push provider SDKs directly. They emit domain facts or explicit notification requests. Notifications owns provider delivery, retries, suppression and delivery state.

## Package integrations
Search, Reporting, Dashboard, SEO, Scope, SDUI and Page Builder are package/service integrations, not new microservices unless an ADR changes the boundary.

## Completion gate
No service plan is complete until every module is implementation-specified at file/method/controller/event/queue/job/scheduler/persistence/security/observability/test level, with no unresolved architecture.
