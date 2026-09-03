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

## Contracts

Cross-service DTOs, commands, queries, events and errors are versioned in `@stackra/contracts`. Consumers never import another service's implementation, ORM entities, repositories or providers.

## Workflow

`@stackra/workflow` is the reusable workflow definition/execution-client SDK. The Workflow service owns durable execution, timers, retries, compensation, human tasks and approvals. Business services define workflows with the SDK and expose the business commands/events they execute.

## Authorization

Identity answers who is authenticated. IAM answers whether the principal may act. Policy is part of IAM. Monetization provides commercial entitlement decisions. Services do not implement private authorization systems.

## Required coverage

Every service plan must define ownership, modules, models, relations, DTOs, application interfaces/methods, controllers, events/commands, persistence/migrations, runtime roles, idempotency, retries/DLQ, tenancy, security, audit, observability, health/readiness, graceful shutdown, scaling, tests and deployment.
