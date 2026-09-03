# 10 — Domain & Application Patterns

**Status:** Baseline **Owner:** Platform architecture (applies to every NestJS
service + application backend) **Related:**
[11 Events & workflows](11-events-and-workflows.md),
[09 Service communication](09-service-communication.md),
[14 Data & persistence](14-data-and-persistence.md)

---

## 1. Purpose

Define the internal shape of a Figentra backend service/application: how a
request flows from controller to persistence, the ORM, and the write path that
produces events. This is the R-4 (MikroORM) + R-5 (controller→outbox) decision.

Applies to substantial services (Cloudflare Containers + NestJS). Lightweight
Workers (Hono) use a thinner version of the same layering.

---

## 2. Controllers — resource / bounded-context controllers

Not one controller per action; not one giant controller per application. Use
**resource controllers** grouped by bounded context.

```text
ProductsController      OrdersController      CustomersController
```

### 2.1 Standard CRUD

```text
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

### 2.2 Business commands (beyond CRUD)

Explicit, intent-named sub-resource actions:

```text
POST /products/:id/publish
POST /orders/:id/refund
POST /orders/:id/cancel
POST /domains/:id/verify
POST /integrations/:id/reconnect
```

Business commands are verbs on a resource, not generic RPC endpoints. They map
to a Command in the write path (§4).

---

## 3. Layered request flow (R-5)

The controller stays **thin**. The flow:

```text
Controller
    │  (validate input, build Command/Query, attach context)
    ▼
Command / Query
    │
    ▼
Use Case            (application service — one use case per business operation)
    │
    ▼
Domain              (entities, value objects, invariants)
    │
    ▼
Repository          (persistence via MikroORM)
    │
    ▼
Outbox              (domain events written in the same transaction)
    │
    ▼
Events              (published after commit — see [11])
```

Responsibilities per layer:

| Layer         | Owns                                                                  | Does NOT                          |
| ------------- | --------------------------------------------------------------------- | --------------------------------- |
| Controller    | HTTP concerns, input validation, mapping to Command/Query, context    | Business logic, persistence       |
| Command/Query | An intent (write) or a read request; a serializable, validated object | Execute logic                     |
| Use Case      | Orchestrate one business operation; transaction boundary              | HTTP, direct SQL                  |
| Domain        | Entities, value objects, invariants, domain events                    | Persistence, transport            |
| Repository    | Load/save aggregates via MikroORM                                     | Business rules                    |
| Outbox        | Persist domain events atomically with the aggregate                   | Deliver events (that's the relay) |

**CQRS-lite:** commands and queries are separated at the application layer, but
this is **not** full event-sourcing — the aggregate is persisted normally; the
outbox is for reliable event delivery, not as the system of record.

---

## 4. Write path & the transactional outbox

Every state-changing operation follows the same shape:

```text
Use Case (single DB transaction)
  1. load aggregate via repository
  2. execute domain operation (invariants enforced in the domain)
  3. persist aggregate
  4. append domain event(s) to the OUTBOX table  ── same transaction
  commit
        │
        ▼
Outbox relay (after commit)
  → publishes to the event transport (Queues)
  → marks outbox row dispatched
        │
        ▼
Idempotent consumers  (see [11])
```

Because the aggregate write and the outbox append share one transaction, an
event is emitted **if and only if** the state change committed — no lost events,
no phantom events. Detail (outbox schema, relay, idempotency) is in
[11 §Transactional outbox](11-events-and-workflows.md).

---

## 5. ORM — MikroORM (R-4)

**Decision:** MikroORM, not TypeORM.

- **Default entity style:** `defineEntity` + class. Decorators remain available
  selectively where they read better.
- Rationale: MikroORM's current guidance recommends the `defineEntity` + class
  pattern with strong TypeScript inference; it fits the explicit
  metadata/compilation direction of the platform.
- MikroORM's Unit of Work + Identity Map align with the aggregate/repository
  pattern above; the outbox append participates in the same UoW transaction.

```typescript
// Illustrative — defineEntity + class default
export const Product = defineEntity({
  name: "Product",
  properties: (p) => ({
    id: p.type("uuid").primary(),
    tenantId: p.type("uuid"),
    name: p.string(),
    status: p.enum(["draft", "published"]),
    createdAt: p.datetime().onCreate(() => new Date()),
  }),
});
```

Repositories wrap the EntityManager; use cases own the transaction boundary
(`em.transactional(...)`), inside which both the aggregate and the outbox row
are written.

---

## 6. Application backend shape

Every Figentra application backend follows the same internal structure:

```text
applications/<app>/backend
├── src/
│   ├── modules/<context>/            e.g. products, orders, customers
│   │   ├── <context>.controller.ts   resource controller
│   │   ├── commands/                 command objects + handlers (use cases)
│   │   ├── queries/                  query objects + handlers
│   │   ├── domain/                   entities, value objects, domain events
│   │   ├── <context>.repository.ts   MikroORM repository
│   │   └── <context>.contracts.ts    DTOs / API types (or from @figentra/contracts)
│   ├── platform/                     platform SDK wiring ([09])
│   └── main.ts
├── Dockerfile
└── package.json
```

Application backends must implement the platform contract from
[App service contract](#7-platform-application-contract).

---

## 7. Platform application contract

Every application exposes:

```text
GET /health
GET /ready
GET /v1/platform/context
```

and accepts a trusted platform context:

```typescript
interface PlatformContext {
  actorId: string;
  userId?: string;
  tenantId: string;
  supabaseOrganizationId?: string;
  applicationKey: string;
  requestId: string;
  traceId: string;
}
```

The application remains responsible for domain rules, application permissions,
business validation, application data (tenant-isolated), and its workflows. It
never re-implements identity/tenant/billing/IAM.

---

## 8. Validation & error handling

- Validate at API boundaries (schema validation — Zod / class-validator).
- Domain invariants live in the domain layer, not the controller.
- Errors use the platform error envelope + codes
  ([18](18-error-model-and-api-conventions.md)).
- Every write path is idempotent where retries are possible (idempotency key on
  commands that create resources or move money).

---

## 9. Non-goals / anti-patterns

| Anti-pattern                                             | Correct                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| One controller per action                                | Resource / bounded-context controllers.                       |
| One giant controller per application                     | Split by bounded context.                                     |
| Business logic in the controller                         | Controller is thin; logic in use case + domain.               |
| Publishing events directly from the use case (no outbox) | Append to outbox in the same transaction; relay publishes.    |
| TypeORM / a second ORM                                   | MikroORM (`defineEntity` + class).                            |
| Event-sourcing the aggregate as the system of record     | CQRS-lite; aggregate persisted normally; outbox for delivery. |
| Application re-implementing identity/tenant/billing      | Consume platform SDK + contracts.                             |
| Sharing MikroORM entities across services                | Share contracts, not entities ([09 §8]).                      |

---

## 10. Open questions

- Confirm the validation library standard (Zod vs class-validator) for NestJS
  services vs Hono workers (frontend uses Zod — [13]).
- Confirm whether commands/queries use a mediator (e.g. Nest CQRS module) or
  plain injected handlers.
