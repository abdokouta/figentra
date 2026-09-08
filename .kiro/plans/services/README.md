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

Every service uses the full day-one production contract: README plus `01-architecture.md` through `21-definition-of-done.md`. The documents form one contract and must remain mutually consistent.

## Completed plan sets

Identity, IAM, Tenant, Audit, Integrations, Search and Reporting have the full production plan set. Monetization, Usage, Workflow, Notifications, Files, Analytics and Marketing remain to be brought to the same contract.

## Runtime

Each business service uses one NestJS source tree and may expose `api`, `consumer`, `worker` and `scheduler` roles. A mirrored `workers/<service>` application is forbidden unless an ADR proves an independent deployment boundary.

## Gateway vs service responsibility

The Gateway owns public edge-global transport concerns. NestJS services remain independent security/correctness boundaries and continue to validate context, authorization, DTOs, idempotency, transactions, domain errors and observability.

## Contracts

Cross-service DTOs, commands, queries, events and errors are versioned in `@stackra/contracts`. Consumers never import another service's implementation, ORM entities, repositories or providers.

## Search and Reporting platform boundary

Search owns `search-*` indexes and search semantics: entity discovery, relevance, filters, facets, autocomplete and suggestions. Reporting owns `facts-*`, `dimensions-*` and `aggregates-*` and analytical semantics. Both consume domain events and may initially share one Amazon OpenSearch deployment while maintaining strict index ownership. Business services never write these indexes directly.

## Completion gate

No service is complete until all 21 numbered contracts are implemented and every runtime artifact is discoverable/registered/tested. No route, permission, event, queue, consumer, worker, schedule, notification, realtime channel, setting, middleware/guard/interceptor/pipe/filter, dependency, migration or recovery path may exist only implicitly.
