---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
---

# Service / Worker / Package Architecture

## Decision

Figentra does **not** use a package + service + worker triplet for each capability.

A bounded context is owned by a deployable service. Its implementation lives under `services/<service>/src/modules`. A service may expose multiple runtime roles from the **same codebase**: HTTP API, NATS microservice, event consumer, queue consumer, scheduler, or background processor. Separate worker applications are exceptional, not the default.

Reusable technical capabilities belong in `packages/`. Cross-service contracts belong in `@stackra/contracts`.

## Canonical boundaries

```text
@stackra/contracts
    ↓ typed protocol boundary
services/<bounded-context>/
    ├── src/modules/       domain implementation
    ├── src/api/           HTTP/control-plane bootstrap
    ├── src/transport/     NATS/message bootstrap
    └── src/worker/        optional worker bootstrap
```

The same service source tree can produce multiple deployable roles:

```text
notifications-api × N
notifications-worker × N
```

Both are built from `services/notifications`; they are not two implementations of Notifications.

## NestJS standard

NestJS natively supports microservices and multiple transports, including NATS, request/response messaging, event-based messaging and queue groups. A Nest application can also be hybrid, combining HTTP with microservice listeners. This is the preferred service pattern when the service needs both synchronous APIs and asynchronous consumers. See the NestJS microservices and NATS documentation.

The runtime bootstrap MUST make the role explicit and MUST NOT rely on process-global mutable state. Typical roles are `api`, `worker`, `consumer`, and `scheduler`.

## Worker execution

A worker role is created only when asynchronous processing materially differs from request/response serving. Examples include notification delivery, analytics ingestion/aggregation, audit ingestion, media processing, search indexing and scheduled campaign execution.

Workers use the same domain modules and contracts as the service API. They receive work through NATS/JetStream or the selected queue abstraction, use idempotency keys, acknowledge only after durable processing, implement bounded concurrency, retries and DLQ/reconciliation, and participate in graceful shutdown.

A separate `workers/` top-level application is permitted only when the workload has a genuinely different deployment/runtime boundary that cannot reasonably be represented as a role of its owning service.

## Cloudflare Workers

Cloudflare Workers are **not** the generic Figentra background-worker runtime. They are an edge/serverless runtime for workloads that benefit from Cloudflare's execution model and services. They may be used for edge routing, lightweight request handling, webhooks, caching, transformations or Cloudflare-native integrations.

A conventional NestJS service remains a Node.js application. Cloudflare now provides substantial Node.js compatibility, but it is a compatibility layer over the Workers runtime rather than a reason to make NestJS the default Workers execution model. Runtime-specific APIs, lifecycle and resource semantics remain different.

Therefore:

- NestJS/Node.js is the canonical Figentra service and worker runtime.
- Cloudflare Workers are an explicit edge runtime.
- No architecture may require NestJS business services to run on Cloudflare Workers.
- A Cloudflare Worker may call or publish to Figentra services through approved contracts/transports.

## Package rule

A package must be justified by reuse across bounded contexts or runtimes. Domain ownership alone is not sufficient reason to create a package.

Examples of valid packages:

- `@stackra/contracts`
- `@stackra/container`
- `@stackra/errors`
- `@stackra/config`
- `@stackra/logger`
- `@stackra/observability`
- `@stackra/database`
- `@stackra/orm`
- `@stackra/http`
- `@stackra/nats`
- `@stackra/identity` where the reusable identity/authentication SDK boundary is real
- `@stackra/tracking` where a browser/mobile/desktop SDK is genuinely reused

Business implementations such as Notifications, Analytics, Marketing and Audit are service-owned. Other services consume their contracts; they do not import their implementation packages.

## Contract rule

`@stackra/contracts` is the typed inter-service protocol. It contains stable DTOs, schemas, commands, queries, events, errors, enums and public interfaces required by consumers.

Internal implementation interfaces remain inside the owning service. Provider SDK types and persistence models never cross the service boundary.

Consumers depend on:

```ts
import type { SendNotificationRequest } from '@stackra/contracts/notifications';
```

They do not depend on:

```ts
import { NotificationService } from '@stackra/notifications';
```

## NestJS enterprise standards

Every service role follows the platform service standard:

- explicit bootstrap and runtime role;
- dependency injection through Nest modules/providers;
- module boundaries aligned with bounded contexts;
- Fastify where selected by the platform standard;
- global validation using the platform schema/validation policy;
- versioned OpenAPI for HTTP contracts;
- NATS request/response and event handlers for asynchronous integration;
- queue groups/consumer groups for horizontal worker scaling;
- correlation/request/trace propagation;
- structured logging through `@stackra/logger`;
- OpenTelemetry through `@stackra/observability`;
- health/readiness endpoints for API roles and equivalent readiness semantics for workers;
- graceful shutdown and connection draining;
- bounded concurrency, timeouts, retries and idempotency;
- no secrets or tokens in logs/telemetry;
- tenant context validated server-side;
- service-to-service authentication and authorization;
- immutable versioned contracts;
- unit, integration, contract and end-to-end tests;
- containerized immutable production builds.

NestJS documents validation, hybrid applications, NATS queue groups, lifecycle shutdown hooks, OpenAPI and production deployment as first-class mechanisms; Figentra standardizes these mechanisms rather than inventing a parallel framework.

## Consequences

- `services/` becomes the primary home for business capabilities.
- `workers/` stops being a mirrored copy of services.
- `packages/capabilities/*` is not a default home for business-domain implementations.
- Cross-service reuse happens through contracts, not source-code coupling.
- API and worker deployments can scale independently while sharing one implementation.
- Cloudflare remains available without becoming a second backend architecture.
- The architecture is simpler, easier to test, and consistent with NestJS's native application/microservice model.

## Review gate

Any proposal for a new package, service or independent worker must answer:

1. Who owns the business capability?
2. Is this code reused by multiple bounded contexts?
3. Is the proposed package implementation-free infrastructure/SDK, or is it hiding business ownership?
4. Can the asynchronous workload run as a role of its owning NestJS service?
5. If a separate worker is required, what runtime/deployment boundary justifies it?
6. What belongs in `@stackra/contracts` for external consumers?

If those questions do not justify a separate boundary, do not create one.
