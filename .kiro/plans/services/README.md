# Service Plans

Services are the **sole owners of business/domain implementations** in Figentra. Implementation lives under `services/<service>/src/modules` and follows the corresponding `.kiro/specs/figentra-platform/services/*` specification.

A service may expose multiple deployment roles from the same NestJS codebase:

- `api` — HTTP/control-plane endpoints;
- `consumer` — NATS/event handlers;
- `worker` — asynchronous jobs and durable background processing;
- `scheduler` — scheduled orchestration when required.

API and worker instances are independently scalable deployments of the same service source. A mirrored `workers/<service>` implementation is not allowed unless an ADR proves a genuinely independent runtime/deployment boundary.

Cross-service consumers import only versioned public contracts from `@stackra/contracts`. They never import another service's implementation, ORM entities, repositories, providers, or internal interfaces.

Current service specifications include: identity, tenant, scope, IAM, policy, approval, monetization, entitlements, usage, notifications, audit, files, integrations, reporting, search, and workflow.

Each service plan must document modules, API/message contracts, persistence, role bootstraps, NATS/queue consumers, idempotency, retries/DLQ, tenancy, security, observability, health/readiness, graceful shutdown, scaling, testing, migrations, and deployment.
