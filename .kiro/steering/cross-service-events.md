---
inclusion: always
---

# Cross-service events — the cascade contract

> **ADR anchor.** Codified by
> [ADR-0089](../../.docs/adr/0089-cross-service-fk-ban-and-event-driven-cascade.md)
> — Cross-service FK ban + event-driven cascade. This doc anchors the HOW (event
> vocabulary + listener contract + failure semantics);
> [`data-ownership.md`](data-ownership.md) anchors the WHY.

The contract every backend service (Cloudflare Worker, Go, or Python) follows
when a state change in service X needs to propagate into services Y, Z, ….
Extends [`data-ownership.md`](data-ownership.md) Rule 3 with the concrete event
shape + listener pattern + idempotency + DLQ semantics.

Read alongside:

- [`data-ownership.md`](data-ownership.md) — the sibling row-ownership contract
  that delegates cross-service cascade to this doc.
- [`observability-signals.md`](../../.ref/steering/observability-signals.md) — the parallel
  three-signal contract that services already emit through `@stackra/events`
  (the workspace event bus). Same substrate, different payloads.
- [`events-authoring.md`](../../.ref/steering/events-authoring.md) — the frontend sibling; the
  three-pillar rule (constant + typed payload + discovery docblock) applies
  identically to backend TypeScript event catalogs.

## Precedence

1. This file wins over generic pub/sub guidance.
2. SAME-service work fans out via in-process function calls; CROSS-service
   cascade fans out via the events codified here.
3. `data-ownership.md` still owns the ROW-OWNERSHIP contract; this file owns the
   CASCADE contract that ADR-0089's Rule 3 delegates to.

## The cascade cycle

Every cross-service cascade follows a fixed lifecycle. The event bus is
`@stackra/events`, backed by Cloudflare Queues fanout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Owning service (e.g. identity-service)                          │
│                                                                  │
│  1. Domain action deletes a row (`deleteTenant(tenantId)`)      │
│  2. Post-delete hook emits `TenantDeleted { tenantId, ... }`    │
│     via @stackra/events (Cloudflare Queues fanout).             │
└──────────────────────────┬──────────────────────────────────────┘
                           │  channel: stackra-event-relay
                           ▼
      ┌────────────────────┼────────────────────┬──────────────────┐
      ▼                    ▼                    ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌───────────┐
│ commerce     │   │ notifications│   │ observability    │   │ platform  │
│ @OnEvent     │   │ @OnEvent     │   │ @OnEvent         │   │ @OnEvent  │
│ handler:     │   │ handler:     │   │ handler:         │   │ handler:  │
│   soft-delete│   │ purge inbox  │   │ retain audits    │   │ purge     │
│   subscription│   │ + tokens     │   │  (retention pol) │   │ orgs+     │
│                │   │             │   │                    │   │ branches  │
└──────────────┘   └──────────────┘   └──────────────────┘   └───────────┘
```

Every listener is idempotent, DLQ-backed, and observed. The owning service NEVER
blocks on listener completion — the cascade is fire-and-forget with retry.

## Rule 1 — Event vocabulary

Every cascadeable entity ships EXACTLY ONE canonical `<Entity>Deleted` event
type in `@stackra/contracts` under `events/<domain>/`. The contracts package is
the only module consumers import from; the owning service publishes, every peer
subscribes.

### The canonical event set

| Event type            | Module                                | Emitted by       | Cascadeable entity |
| --------------------- | ------------------------------------- | ---------------- | ------------------ |
| `TenantDeleted`       | `@stackra/contracts` events/tenancy   | identity-service | Tenant             |
| `UserDeleted`         | `@stackra/contracts` events/user      | identity-service | User               |
| `ApplicationDeleted`  | `@stackra/contracts` events/application| identity-service | Application        |
| `OrganizationDeleted` | `@stackra/contracts` events/organization | platform-service | Organization    |
| `BranchDeleted`       | `@stackra/contracts` events/branch    | platform-service | Branch             |
| `RegionDeleted`       | `@stackra/contracts` events/region    | platform-service | Region             |

Adding a new cascadeable entity requires:

1. New event type + name constant under `@stackra/contracts` `events/<domain>/`.
2. Publisher hook on the owning service.
3. At least ONE listener on a non-owning service that persists the referenced
   column — otherwise the event isn't cascadeable, it's just noise.

### Event payload shape

Every `<Entity>Deleted` event ships a name constant + a `readonly` payload type:

```ts
// @stackra/contracts — events/tenancy/tenant-deleted.event.ts

/** Event name constant — every emit + @OnEvent uses this, never a literal. */
export const TENANT_DELETED = "tenancy.tenant.deleted" as const;

/**
 * Emitted after identity-service deletes a tenant. Cascade
 * listeners subscribe in every non-owning service that persists
 * `tenant_id` on its rows.
 *
 * ## Emitters
 * - `deleteTenant` action (identity-service).
 *
 * ## Current listeners
 * - commerce-service — soft-deletes tenant subscriptions.
 * - notifications-service — purges push tokens + inbox rows.
 * - observability-service — flags audits for retention-policy
 *   sweep (never hard-delete; compliance mandates retention).
 * - platform-service — cascades to organizations + branches.
 *
 * ## Order
 * Undefined — listeners react independently. NEVER rely on
 * ordering across services.
 */
export interface TenantDeletedPayload {
  /** ULID of the deleted tenant. */
  readonly tenantId: string;
  /** ULID of the Application the tenant belonged to. */
  readonly applicationId: string;
  /** Deletion reason enum backing string. */
  readonly reason: string;
  /** ISO-8601 timestamp — when the delete landed in identity's DB. */
  readonly deletedAt: string;
  /** Correlation ID from the request that triggered the delete. */
  readonly correlationId: string;
  /** Event ID (ULID) for listener-side idempotency dedup. */
  readonly eventId: string;
}
```

Rules for the payload:

- **`eventId`** — mandatory ULID. Every listener uses this for dedup.
- **`correlationId`** — carried from the originating HTTP request so audit +
  tracing can stitch the full cascade.
- **Every field `readonly`.** The event is immutable across the pipeline.
- **camelCase field keys** on the wire — matches the JSON DTO convention.

## Rule 2 — Publisher contract

The OWNING service publishes exactly ONE canonical event per cascadeable delete.
Publication happens INSIDE the same transaction as the row delete (atomic outbox
pattern) so the event never emits without the state change landing.

```ts
// identity-service — inside the deleteTenant action
export async function deleteTenant(input: DeleteTenantInput): Promise<void> {
  await db.transaction(async (tx) => {
    const tenant = await tx.tenants.findOrFail(input.tenantId);
    await tx.tenants.delete(tenant.id);

    // Outbox row — dispatched by the outbox processor after the
    // transaction commits. The Cloudflare Queues fanout picks it up.
    await events.emit(TENANT_DELETED, {
      tenantId: tenant.id,
      applicationId: tenant.applicationId,
      reason: input.reason ?? "admin",
      deletedAt: new Date().toISOString(),
      correlationId: request.headers.get("X-Correlation-Id") ?? ulid(),
      eventId: ulid(),
    } satisfies TenantDeletedPayload);
  });
}
```

Rules for the publisher:

- **One event per delete.** Not one per row affected inside the service's own DB
  (that's local cascade, handled by same-service FKs / `ON DELETE CASCADE`). One
  event for the CASCADEABLE ENTITY.
- **Emit inside the transaction.** The outbox row lives in the same DB as the
  deleted row so both commit atomically.
- **Never publish inline HTTP calls.** Cross-service cascade is fire-and-forget
  via `@stackra/events`; synchronous peer HTTP calls during a delete are a Rule
  3 violation.

## Rule 3 — Listener contract

Every non-owning service that PERSISTS a column referencing the deleted entity
MUST author an `@OnEvent` handler that cascades the delete inside its own DB.

```ts
// notifications-service — src/listeners/cascade-tenant-deleted.listener.ts
import { OnEvent } from "@stackra/events";
import { TENANT_DELETED, type TenantDeletedPayload } from "@stackra/contracts";
import type { IdempotencyStore } from "@stackra/idempotency";

/**
 * Cascade listener — purges notifications-service's local rows
 * that reference the deleted tenant.
 *
 * Reacts to: TENANT_DELETED.
 * Emitted by: identity-service.
 * Sibling listeners on the same event:
 *   - commerce-service (soft-deletes subscriptions)
 *   - observability-service (retention-policy sweep)
 *   - platform-service (cascade orgs + branches)
 */
export class CascadeTenantDeletedToNotifications {
  constructor(private readonly idempotency: IdempotencyStore) {}

  @OnEvent(TENANT_DELETED)
  async handle(event: TenantDeletedPayload): Promise<void> {
    // Idempotency — dedup by event ID within this service.
    // A retried event with the same ID is a no-op.
    if (await this.idempotency.alreadyProcessed(event.eventId)) {
      return;
    }

    await db.transaction(async (tx) => {
      // Purge push subscriptions + in-app inbox rows.
      await tx.pushSubscriptions.deleteWhere({ tenantId: event.tenantId });
      await tx.inAppMessages.deleteWhere({ tenantId: event.tenantId });

      // Mark the event as processed AFTER the local writes land.
      // The idempotency store lives in the same DB so both commit
      // atomically.
      await this.idempotency.markProcessed(event.eventId, {
        actor: "notifications",
      });
    });
  }
}
```

Rules for the listener:

- **One handler per (service, event) pair.** Every service authors AT MOST one
  listener per event type — cascade logic consolidates in one handler, not
  scattered across N.
- **Idempotent by construction.** Every handler dedups via
  `@stackra/idempotency`'s `IdempotencyStore` keyed on `eventId`. A retry or
  duplicate delivery is a no-op.
- **Same DB transaction as `markProcessed()`.** The local writes + the
  idempotency stamp commit atomically; a partial cascade never leaves the event
  "processed" without the state change.
- **NEVER read across service boundaries during the handler.** If the listener
  needs peer data, it lives on the event payload (Rule 1) OR the listener reads
  its own local materialised view.
- **Retention beats deletion when compliance mandates it.**
  observability-service does NOT hard-delete audits when a tenant deletes — it
  marks them for retention-policy sweep. Cascade semantics vary per-row
  per-service.

## Rule 4 — Idempotency contract

Every listener dedups via `@stackra/idempotency`. Rules:

- **Keyed on `event.eventId`** — the ULID the publisher stamped. Never keyed on
  any application ID (tenant, user, application), because a real delete + a
  retry both carry the same tenant ID and would collapse incorrectly.
- **Per-service dedup window.** Each service's idempotency table is local; two
  services processing the same event dedup independently.
- **Retention window ≥ DLQ retention.** The idempotency store keeps processed
  IDs at least as long as the DLQ retains its retry envelope — otherwise a
  DLQ-drained retry after the window expires would re-process a delete.
- **Fail-soft on store outage.** If the idempotency store is down, the handler
  MAY skip dedup + rely on the underlying operation's natural idempotency (a
  `DELETE ... WHERE tenant_id = ?` is idempotent by construction). Log the skip.

## Rule 5 — Failure semantics + DLQ

Every listener runs on `@stackra/events`'s Cloudflare Queues fanout inside a
queued consumer. Failure envelope:

- **Transient failure** (DB timeout, deadlock, transient peer outage) →
  automatic retry with exponential backoff. Configuration lives on the
  subscription via `@OnEvent(TENANT_DELETED, { retries: 5, backoff: "exponential" })`.
- **Persistent failure** (5 retries exhausted) → the event lands in the
  service's local Dead Letter Queue (DLQ). An operator drains the DLQ manually
  via `pnpm events:dlq:replay <event-id>` (or the admin endpoint) after fixing
  root cause.
- **Alert on DLQ growth.** DLQ depth is a monitored aggregate (per
  `observability-signals.md` §Rule 3, via Cloudflare Analytics Engine). SLO: DLQ
  depth < 10 per service; alert to on-call when breached.
- **Never swallow the exception silently.** Every failure logs a structured
  error including `eventId`, `correlationId`, and the offending listener class —
  reviewable in Sentry.

## Rule 6 — Non-goals + explicit exclusions

These shapes are NOT part of the cross-service event contract:

- **Two-phase commit across services.** Never. Cross-service cascade is
  eventually consistent; there is no distributed transaction primitive in this
  contract.
- **Request/reply over events.** Never — that's an RPC call in disguise. See
  `communication-patterns.md` §Lane 1 for the correct in-process pattern within
  a service; the generated TypeScript SDK per ADR-0087 for cross-service
  synchronous reads.
- **Ordering guarantees across services.** Undocumented. The queue fanout may
  deliver `TenantDeleted` to service A before service B; every listener MUST
  tolerate out-of-order + retried delivery. Payloads carry timestamps for
  consumer-side ordering when strictly required (rare).
- **Peer HTTP calls inside a listener.** The listener cascades LOCAL state only.
  If a cascade needs peer state, that peer subscribes to the same event and
  cascades independently.
- **Business logic beyond cascade.** A listener that soft-deletes tenant rows is
  a cascade; a listener that emails "your tenant was deleted" is a business
  action. Business actions live in the OWNING service's workflow, not in a peer
  cascade handler.

## Anti-patterns

| Anti-pattern                                                                | Correct                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Event type in the owning service's own module (`services/identity/events/`) | Move to `@stackra/contracts` `events/tenancy/` per Rule 1.                                          |
| Publishing via `fetch('https://peer/...')` inside a delete action           | Emit the event via `@stackra/events`; the peer subscribes. Never synchronous HTTP for cascade.      |
| Two events for the same delete (`TenantSoftDeleted` + `TenantHardDeleted`)  | One canonical `TenantDeleted` per Rule 1. Payload carries the reason enum for consumer-side branch. |
| Listener with no idempotency dedup                                          | Compose `IdempotencyStore` per Rule 4. A retried event without dedup double-cascades.               |
| Listener that reads peer data via HTTP inside the handler                   | Carry required peer state on the event payload. Rule 3 forbids cross-service reads mid-handler.     |
| Listener that swallows the exception (`try/catch { /* */ }`)                | Let the event framework retry → DLQ. Silent swallowing hides real failures. Rule 5.                 |
| Two listeners per (service, event) pair                                     | One handler per Rule 3. Consolidate cascade logic; extract helpers as needed.                       |
| Cross-service two-phase commit ("wait for every listener to ack")           | Never — Rule 6. Cascade is fire-and-forget; eventual consistency by design.                         |
| A raw queue producer / direct `fetch` that bypasses `@stackra/events`       | Every cross-service event routes through `@stackra/events`. Bespoke transports break DLQ + retry.   |

## Enforcement

Zero-hit greps a reviewer runs before merging:

```sh
# Every @OnEvent(<Entity>Deleted) handler names an idempotency dedup
# call. Missing = Rule 4 violation.
grep -rEn "@OnEvent\(.*Deleted" \
  services/*/src/**/listeners/*.ts 2>/dev/null | \
  while read handler; do
    file="${handler%%:*}"
    grep -qE 'alreadyProcessed|markProcessed' "$file" || \
      echo "MISSING idempotency: $file"
  done

# Cross-service event type defined outside @stackra/contracts.
grep -rEn "export (interface|type) \w+DeletedPayload" \
  services/*/src/ apps/*/src/ 2>/dev/null

# Listener that reaches for fetch mid-handler.
grep -rEn "\bfetch\(" \
  services/*/src/**/listeners/*.ts 2>/dev/null
```

The primary enforcement is human review + Sentry alerts on DLQ growth.
Structural anti-patterns are caught by the greps above; missing idempotency +
cross-service reads are caught by reviewer discipline plus the per-service test
suite (every listener ships a Vitest test that asserts idempotency).

## Cross-references

- [ADR-0089](../../.docs/adr/0089-cross-service-fk-ban-and-event-driven-cascade.md)
  — Cross-service FK ban + event-driven cascade (this doc's authorising ADR).
- [ADR-0032](../../.docs/adr/0032-six-service-split.md) — six-service split that
  makes cross-service cascade a first-class concern.
- [ADR-0033](../../.docs/adr/0033-cross-service-authentication-contract.md) —
  cross-service authentication contract carried on the event payload for audit
  stitching.
- [ADR-0065](../../.docs/adr/0065-central-observability-store-via-sdk.md) — the
  same event fanout shape applied to audit + activity.
- Steering — [`data-ownership.md`](data-ownership.md) — sibling ownership
  contract; this doc's Rule 3 satisfies its Rule 3.
- Steering — [`observability-signals.md`](../../.ref/steering/observability-signals.md) — audit +
  activity fanout via the same event substrate.
- Steering — [`events-authoring.md`](../../.ref/steering/events-authoring.md) — three-pillar event
  rule (constant + payload type + docblock).
- Package — `@stackra/events` — the event bus (Cloudflare Queues fanout) every
  event routes through.
- Package — `@stackra/idempotency` — the DLQ-safe dedup primitive Rule 4
  composes.
