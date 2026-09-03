# Figentra Services — Universal Implementation Contract

**Status:** Canonical normative specification.  
**Applies to:** every `services/*` bounded context.

This document is the mandatory implementation shape for every Figentra service. Individual service specs specialize ownership, models and operations; they MUST NOT weaken these rules.

## 1. Standard service shape

```text
services/<name>/
├── src/
│   ├── <name>/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── policies/
│   │   │   └── events/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   ├── services/
│   │   │   └── ports/
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── messaging/
│   │   │   └── providers/
│   │   ├── presentation/
│   │   │   ├── controllers/
│   │   │   └── dto/
│   │   ├── consumers/
│   │   ├── workers/
│   │   └── <name>.module.ts
│   ├── database/migrations/
│   ├── i18n/en/
│   ├── i18n/ar/
│   ├── app.module.ts
│   └── main.ts
├── test/
└── package.json
```

One source tree produces API, NATS consumer, worker and scheduler deployables. A mirrored `workers/<service>` implementation is prohibited unless an ADR proves a separate bounded runtime is required.

## 2. Mandatory request context

```ts
interface RequestContext {
  requestId: string;
  correlationId: string;
  causationId?: string;
  traceId?: string;
  principalId: string;
  principalType: 'human'|'service'|'integration'|'system'|'agent';
  tenantId?: string;
  scopeId?: string;
  locale: string;
  source: 'external'|'internal'|'worker'|'scheduler';
}
```

Tenant/scope context comes from trusted authentication/context middleware. A client cannot select another tenant by sending `tenantId` in a body/query parameter.

## 3. Mandatory execution pipeline

```text
HTTP/NATS/Queue
 ↓
transport adapter
 ↓
authentication
 ↓
RequestContext
 ↓
validation
 ↓
IAM authorization
 ↓
entitlement/feature checks where required
 ↓
command/query
 ↓
use case
 ↓
domain
 ↓
repository/transaction
 ↓
outbox
 ↓
commit
 ↓
async consumer if required
```

The gateway is never the only authorization boundary.

## 4. Identity and IAM interaction

### Identity owns

- authentication provider integration
- token verification
- principal identity
- service identities
- identity links
- session context
- delegated/impersonated identity context

### IAM owns

- role assignments
- permissions
- resource/action authorization
- policy evaluation
- grants and revocation

### Standard call

```ts
const principal = await identity.resolveAuthenticatedPrincipal(token);
const decision = await iam.authorize({
  principalId: principal.id,
  tenantId: ctx.tenantId,
  scopeId: ctx.scopeId,
  action: 'resource.action',
  resource: { type: 'resource', id: resourceId },
  context,
});
```

Services MUST NOT implement their own role/permission database.

Identity is not called to answer “may this principal do X?”; IAM/Policy answers that question.

## 5. Gateway interaction

Gateway owns edge concerns:

```text
DNS / TLS / WAF
host resolution
edge rate limiting
request-size limits
coarse token prevalidation
correlation/request IDs
routing
```

The destination service owns:

```text
authentication verification
principal/context binding
tenant/scope validation
IAM authorization
validation
business rules
idempotency
transactions
audit
```

A service remains secure when invoked by an authenticated internal caller without passing through the gateway.

## 6. Contract ownership

All cross-service DTOs, commands, queries, events, errors, enums and public protocol interfaces belong in `@stackra/contracts`.

```text
Service A → @stackra/contracts → Service B
```

Never import:

- another service's entity
- another service's repository
- another service's ORM metadata
- provider SDK types
- private service modules

## 7. Controllers

Controllers are thin transport adapters.

Required methods follow domain intent, not generic CRUD naming:

```text
create()
get()
list()
update()
archive()/delete()
```

plus domain commands such as:

```text
approve()
activate()
pause()
resume()
revoke()
verify()
rotate()
retry()
reconcile()
```

Controllers MUST never contain transaction orchestration, direct ORM queries, provider calls or business authorization logic.

## 8. DTO rules

Every external DTO has:

- explicit schema
- validation
- documented limits
- stable field names
- versioned compatibility
- no ORM entity reuse
- no provider-specific types

Responses are DTOs/projections, never ORM entities.

Pagination uses the canonical cursor contract where collection size warrants it.

## 9. Domain rules

Entities enforce invariants and legal state transitions. Value objects represent validated concepts such as identifiers, keys, money, intervals, URLs, statuses and bounded names.

State-changing methods are explicit:

```ts
aggregate.activate(actor);
aggregate.pause(actor, reason);
aggregate.revoke(actor);
```

Do not expose unrestricted setters for invariant-bearing state.

## 10. Persistence

MikroORM is the persistence mapping layer.

```text
UseCase → Repository → MikroORM → PostgreSQL
```

Database owns connections, lifecycle, transactions, migrations and health. ORM owns entities, repositories, Unit of Work, identity map and persistence mapping.

No service writes another service's database.

## 11. Transaction + outbox

When a state change produces a durable event:

```text
BEGIN
  mutate domain state
  append outbox record
COMMIT
```

A relay publishes after commit. Consumers are idempotent. Direct publish from controllers is prohibited for transactional events.

## 12. Messaging

Initial durable service-to-service transport: NATS JetStream.

Use Cloudflare Queues only where edge/Cloudflare-native asynchronous execution is appropriate. Kafka requires a scale-driven ADR. Redis Pub/Sub is never the durable business event bus.

Event envelope:

```ts
interface EventEnvelope<T> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  producer: string;
  tenantId?: string;
  principalId?: string;
  correlationId: string;
  causationId?: string;
  payload: T;
}
```

## 13. Worker contract

Workers MUST provide:

- bounded concurrency
- cancellation handling
- visibility/lease or equivalent claim semantics
- idempotency
- retry classification
- exponential backoff
- DLQ for permanent failures
- checkpointing for long jobs
- graceful shutdown
- readiness semantics
- metrics

Schedulers persist job intent; they do not rely on in-memory timers for durable work.

## 14. Service-to-service API client

Each client adapter exposes intention-revealing methods and applies:

- service authentication
- timeout
- cancellation
- bounded retry only for safe/retryable failures
- circuit breaking where needed
- response schema validation
- trace propagation
- error normalization

Example:

```ts
interface IdentityClient {
  resolveAuthenticatedPrincipal(token: string): Promise<PrincipalDto>;
  getPrincipal(id: string): Promise<PrincipalDto>;
  getServicePrincipal(id: string): Promise<ServicePrincipalDto>;
}

interface IamClient {
  authorize(input: AuthorizeRequest): Promise<AuthorizationDecision>;
  checkPermission(input: PermissionCheckRequest): Promise<AuthorizationDecision>;
}

interface TenantClient {
  get(id: string): Promise<TenantDto>;
  assertActive(id: string): Promise<void>;
}

interface EntitlementsClient {
  check(input: EntitlementCheckRequest): Promise<EntitlementDecision>;
}
```

These interfaces describe contracts; implementations are service clients/adapters and their wire DTOs are owned by `@stackra/contracts`.

## 15. Standard error model

```ts
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
  correlationId: string;
}
```

Stable machine-readable codes include authentication, authorization, validation, conflict, not-found, rate-limit, dependency and internal classes.

Never expose stack traces, SQL, secrets or provider credentials.

## 16. API conventions

```text
/v1/<resource>
/v1/<resource>/:id
/v1/<resource>/:id/<command>
```

HTTP semantics:

- GET reads
- POST creates or commands
- PATCH partial updates
- DELETE removes/archives where the domain permits

Mutations that can be retried require idempotency keys.

OpenAPI is generated from the canonical NestJS presentation layer and kept compatible with `@stackra/contracts`.

## 17. Database conventions

Every tenant-owned table includes `tenant_id`.

Recommended metadata:

```text
id
tenant_id
created_at
updated_at
created_by
updated_by
version
metadata
```

Use soft deletion only when business/legal semantics require it. Prefer append-only records for audit/history domains.

Required constraints:

- tenant-aware uniqueness
- indexed foreign keys
- deterministic ordering
- unique idempotency keys where required
- optimistic version constraints for concurrent updates

## 18. Security

- least-privilege service credentials
- short-lived tokens where possible
- secrets from secret management
- no secrets in logs/events
- tenant isolation
- authorization at service boundary
- webhook signature verification
- rate limits for externally exposed mutation surfaces
- request-size limits
- dependency and container scanning
- security-sensitive mutations audited

## 19. Observability

Every service emits structured logs and OpenTelemetry traces/metrics using the platform packages.

Minimum metrics:

```text
http_requests_total
http_request_duration
http_errors_total
dependency_requests_total
dependency_duration
queue_lag
jobs_started
jobs_completed
jobs_failed
db_query_duration
```

Business metrics are service-specific. Audit payloads and sensitive business data are not copied into telemetry.

## 20. Health and lifecycle

API roles expose liveness/readiness according to infrastructure standards. Readiness fails when required dependencies prevent correct processing; liveness must not depend on optional downstream services.

Every role implements graceful shutdown:

```text
stop accepting work
↓
finish/cancel bounded in-flight work
↓
drain consumers
↓
flush telemetry
↓
close DB/transport connections
↓
exit
```

## 21. Testing contract

Every service must have:

```text
unit tests
repository/integration tests
migration-from-empty tests
contract tests
authorization tests
tenant-isolation tests
idempotency tests
failure/retry/DLQ tests
API E2E tests
worker E2E tests where applicable
```

Tests MUST prove both allowed and denied paths.

## 22. No hidden architecture

The following are prohibited in a production target:

```text
TODO architecture
placeholder provider
fake production driver
noop implementation
untyped cross-service calls
shared database writes
gateway-only authorization
in-memory durable state
unbounded worker concurrency
silent fallback between incompatible providers
```

Any genuine future extension must be represented as an explicit versioned extension point, not an unspecified implementation gap.
