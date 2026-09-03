---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: runtime
package: "@stackra/nestjs"
anchor_adrs: [ADR-0017, ADR-0018, ADR-0020, ADR-0091, ADR-0092]
depends_on: ["@stackra/node", "@stackra/container", "@stackra/config", "@stackra/contracts", "@stackra/schema", "@stackra/errors", "@stackra/logger", "@stackra/observability", "@stackra/nats"]
---
# `@stackra/nestjs` — implementation plan

## Purpose and boundary
Canonical NestJS integration/runtime layer for all deployable services. It standardizes application bootstrap, controller registration, request context, validation, authorization guards, error handling, health/readiness, OpenAPI, NATS consumers, role composition and graceful shutdown. Domain code remains framework-testable and controllers never own business logic.

## Service roles
The same service source tree can boot as `api`, `consumer`, `worker`, or `scheduler`. Role selection changes transport/module composition, not domain ownership. Mirrored `workers/<service>` applications are forbidden unless an ADR explicitly defines a different deployment boundary.

## Source tree
```text
packages/nestjs/
├── src/core/{bootstrap,application,module-factory,lifecycle,request-context,errors,index.ts}
├── src/http/{controllers,guards,pipes,interceptors,filters,health,openapi,index.ts}
├── src/messaging/{nats.module.ts,consumer.decorator.ts,consumer-registry.ts,ack-policy.ts,index.ts}
├── src/discovery/{metadata-loader.ts,registry.ts,index.ts}
├── src/roles/{api,consumer,worker,scheduler,index.ts}
├── src/testing/{application-fixture,http-fixture,nats-fixture,role-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Locked bootstrap API
```ts
interface NestServiceOptions {
  name:string;
  role:'api'|'consumer'|'worker'|'scheduler';
  globalPrefix?:string;
  enableOpenApi?:boolean;
  enableHealth?:boolean;
}

function createNestApplication(options:NestServiceOptions):Promise<INestServiceRuntime>;
function createServiceModule(options:ServiceModuleOptions):DynamicModule;
```

Required integration classes/tokens: `RequestContextGuard`, `StandardSchemaValidationPipe`, `IamAuthorizationGuard`, `CanonicalExceptionFilter`, `TraceInterceptor`, `HealthController`, `OpenApiModule`, `NatsTransportModule`, lifecycle hooks and role bootstrap helpers.

## Request pipeline
```text
HTTP/NATS ingress
→ authentication/context establishment
→ RequestContext
→ schema validation
→ IAM authorization
→ commercial entitlement check when contract requires
→ application command/query
→ domain/repository transaction
→ outbox
→ commit
→ response / async acknowledgement
```

The package establishes mechanics; Identity and IAM own authentication/authorization semantics. Controllers must not call repositories directly.

## Controller policy
Controllers are adapters from wire contracts to application use cases. Every route declares method, path, version, schema, auth requirements, IAM action/resource, response schema and error mappings. Health routes are registered through the standard health module, not hand-written service-specific health controllers.

## Discovery/registration
Decorated providers and consumers are discovered through the repository discovery abstraction during bootstrap. Discovery may register explicit providers/handlers but cannot invent domain behavior. Duplicate metadata registrations fail startup. Registration order is deterministic.

## NATS consumers
Consumers use versioned `@stackra/contracts`, NATS JetStream durable semantics, explicit subject/consumer names, bounded concurrency, ack deadlines, retry budgets and DLQ policies. Consumer handlers acknowledge only after durable business completion. A handler receives trusted `RequestContext` reconstructed from headers/envelope.

## Error handling
`@stackra/errors` is mapped by `CanonicalExceptionFilter` to stable HTTP responses. Unknown errors become internal errors with correlation/request IDs. NATS error envelopes preserve canonical codes and retryability. Raw request bodies/provider errors are never exposed.

## Health/readiness
Expose standard `/health/live` and `/health/ready` plus role-appropriate dependency checks. Liveness must not fail solely because a dependency is unavailable. Readiness fails when required DB/NATS/config dependencies are unavailable. Health checks use explicit indicators from the owning runtime/dependency package.

## OpenAPI
Controller DTO schemas generate OpenAPI from the same Standard Schema definitions used for runtime validation. Unsupported schema constructs fail generation. Security schemes, error responses, pagination and request-context metadata are standardized.

## Configuration/security
NestJS never reads `process.env` directly. Configuration comes from `@stackra/config`. Global middleware/guards must be deterministic and ordered. Auth headers are redacted. CORS, body limits, request timeout and trusted-proxy rules are explicit deployment configuration.

## Lifecycle
Bootstrap: config → container → module discovery → DB/NATS initialization → routes/consumers → readiness. Shutdown: stop accepting new work → drain HTTP/NATS/worker operations → flush logs/telemetry/outbox where applicable → dispose resources. Every shutdown hook is idempotent and bounded.

## Observability
Automatic OTel spans for incoming HTTP/NATS, controller/use-case boundaries and dependency calls. Metrics include request latency, status, NATS delivery, handler failures and readiness. Logger integration uses structured records with redaction. Telemetry is non-fatal by default.

## Resource limits
Global request body size, header count/size, query depth, multipart limits, NATS batch/concurrency, handler execution deadline and shutdown deadline are configurable and validated. No unbounded request/consumer buffering.

## Testing
Bootstrap fixture tests role composition, controller contracts, validation, guards, discovery, OpenAPI generation, NATS lifecycle, health/readiness and graceful drain. Conformance ensures every service uses the same RequestContext and error envelope. Security tests cover missing auth, tenant confusion, header spoofing and unauthorized route access.

## Implementation phases
1. Core bootstrap/lifecycle/config/container integration.
2. HTTP request context, schema validation, guards and error filter.
3. NATS/JetStream consumer integration and role composition.
4. Discovery, health, OpenAPI and observability.
5. Testing/conformance/security/load and production verification.

## Exit criteria
- Every NestJS service uses the same bootstrap/role conventions.
- Controllers never bypass application/domain boundaries.
- Identity/IAM/context/error/health semantics are standardized.
- NATS consumers have explicit durable retry/DLQ behavior.
- No mirrored worker framework or direct environment access exists.
