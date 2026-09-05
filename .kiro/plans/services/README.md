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

## Canonical service-document structure

Every service uses the full day-one production contract:

```text
.kiro/plans/services/<service>/
├── README.md
├── 01-architecture.md
├── 02-implementation.md
├── 03-api.md
├── 04-data-model.md
├── 05-events.md
├── 06-jobs-and-scheduling.md
├── 07-security-and-authorization.md
├── 08-observability.md
├── 09-testing.md
├── 10-deployment-and-operations.md
├── 11-messaging.md
├── 12-notifications-and-realtime.md
├── 13-runtime-and-framework.md
├── 14-configuration-and-registry.md
├── 15-dependency-graph.md
├── 16-data-lifecycle.md
├── 17-resilience-and-failure.md
├── 18-migrations-and-upgrades.md
├── 19-capabilities-permissions-and-settings.md
├── 20-runtime-manifest.md
└── 21-definition-of-done.md
```

The documents form one contract and must remain mutually consistent. There is no deferred production architecture, placeholder provider, hidden queue/worker/schedule, magic setting, undocumented notification/realtime channel or unregistered runtime behavior.

## Completed plan sets

Identity, IAM, Tenant, Audit and Integrations have the full production set. Monetization, Usage, Workflow, Notifications, Files, Search, Reporting, Analytics and Marketing must be brought to the same contract.

## Runtime

Each business service uses one NestJS source tree and may expose `api`, `consumer`, `worker` and `scheduler` roles. A mirrored `workers/<service>` application is forbidden unless an ADR proves an independent deployment boundary.

Independent edge/control-plane runtimes are documented under `.kiro/plans/workers/`. The API Gateway is an independent Cloudflare Worker + Hono application, not a NestJS service.

## Gateway vs service responsibility

The Gateway owns public edge-global transport concerns: public route resolution, request/correlation ID creation at internet ingress, trace initiation/propagation, CORS, public security headers, Cloudflare WAF/bot controls, coarse edge rate limiting, token prevalidation, origin routing/authentication, edge caching, and transport/realtime/file proxy concerns.

NestJS services remain independent security/correctness boundaries. They preserve/validate propagated IDs, continue traces, establish trusted RequestContext, authenticate service/user context, resolve Tenant context, perform authoritative IAM/commercial checks, strictly validate DTOs, enforce domain/file/use-case limits, own idempotency/transactions/domain errors, and emit application observability.

Do not remove service validation, authorization, filters or RequestContext because the Gateway has related middleware. Remove only duplicate **edge-only authority**. Canonical split: `.kiro/plans/workers/gateway/13-service-boundary-and-redundancy.md`.

## Required per-module implementation detail

Every service plan must enumerate exact source files and all entities/value objects/invariants; commands/queries/application methods; repository ports/adapters; controllers/routes/DTOs/authz; event schemas; NATS streams/subjects/consumers/DLQs; workers/jobs/schedules; notifications/email/Slack requests; realtime channels; persistence/indexes/migrations; configuration/settings; Registry metadata; tenancy/IAM/audit; middleware/guards/interceptors/pipes/filters/observers; health/readiness; logs/metrics/traces; unit/integration/contract/security/E2E/load/resilience/migration tests; dependency graph; lifecycle/recovery; deployment/rollback/runbooks.

The base matrix remains `.kiro/plans/2026-09-03-service-implementation-contract.md` and is augmented by the numbered service documents above.

## Identity/IAM boundary

Identity answers **who is authenticated**. IAM answers **what that principal may do**. Identity's production provider is Supabase Auth behind the narrow Identity-owned provider port. Clerk is not a day-one dependency and provider authorization concepts are never the IAM source of truth.

## Contracts

Cross-service DTOs, commands, queries, events and errors are versioned in `@stackra/contracts`. Consumers never import another service's implementation, ORM entities, repositories or providers.

## Notifications

Business services never call SMTP, SES, SendGrid, Slack, SMS or push provider SDKs directly. They emit domain facts or explicit notification requests. Notifications owns rendering/delivery/retries/suppression/delivery state.

## Completion gate

No service is complete until all 21 numbered contracts are implemented and every runtime artifact is discoverable/registered/tested. No route, permission, event, queue, consumer, worker, schedule, notification, realtime channel, setting, middleware/guard/interceptor/pipe/filter, dependency, migration or recovery path may exist only implicitly.