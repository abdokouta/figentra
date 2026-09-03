# 11 — Events & Workflows

**Status:** Baseline **Owner:** Platform architecture **Related:**
[10 Domain & application patterns](10-domain-and-application-patterns.md),
[09 Service communication](09-service-communication.md),
[07 Integration Platform](07-integration-platform.md)

---

## 1. Purpose

Define three distinct primitives — **commands**, **domain events**, **audit
events** — plus the reliable delivery mechanism (transactional outbox +
idempotent consumers) and the workflow model (Queues vs Cloudflare Workflows vs
`@figentra/workflows`). This carries R-6 and R-7.

---

## 2. Three distinct concepts (R-6)

| Concept          | Direction | Meaning                                                     | Tense                      |
| ---------------- | --------- | ----------------------------------------------------------- | -------------------------- |
| **Command**      | request   | "Do this." A request to change state; may be rejected.      | imperative (`RefundOrder`) |
| **Domain event** | fact      | "This happened." A completed business state transition.     | past (`order.refunded`)    |
| **Audit event**  | record    | "This was done, by whom, when." Compliance/security record. | past (`iam.role.assigned`) |

Rules:

- **Not every action is an event.** Only **meaningful business state
  transitions** become domain events. **Reads never** emit events.
- A command may produce zero, one, or many domain events.
- Audit events are a **separate stream** from domain events (different
  retention, consumers, and query patterns — [16](16-observability.md),
  [17](17-security-and-compliance.md)).
- **Events announce facts; commands request change; workflows orchestrate
  work.** Never model request/reply as two events + a correlation id (that's
  synchronous HTTP — [09 §2]).

---

## 3. Event envelope

Every platform event (domain or audit) uses one envelope:

```json
{
  "id": "evt_123",
  "type": "subscription.updated",
  "version": 1,
  "occurredAt": "2026-08-30T00:00:00Z",
  "source": "monetization",
  "tenantId": "ten_123",
  "subjectId": "sub_123",
  "traceId": "trace_123",
  "data": {}
}
```

Events are **versioned, idempotently processed, traceable, tenant-aware,
backward-compatible** where possible. Envelope + type naming are governed by
[12 Versioning](12-versioning.md).

### 3.1 Canonical platform events (non-exhaustive)

```text
tenant.created / updated / suspended / archived
domain.added / verified / failed / removed
application.registered / enabled / disabled / version.released
access.granted / access.revoked
subscription.created / updated / canceled
entitlement.changed
usage.recorded
invoice.created   payment.completed   payment.failed
integration.installed / connected / configured / paused / disconnected
user.invited
```

---

## 4. Transactional outbox (reliable delivery)

The write path ([10 §4]) appends events to an outbox in the **same transaction**
as the aggregate. A relay publishes them after commit.

```text
outbox
------
id              obx_...
aggregate_type
aggregate_id
event_type
payload         JSON (the event envelope's data + type)
tenant_id
trace_id
created_at
dispatched_at   nullable
attempts        int
status          pending | dispatched | failed
```

```text
Use Case transaction:  save(aggregate) + append(outbox row)  ── atomic
        │  commit
        ▼
Outbox relay (poller or CDC): read pending rows → publish to Queues → mark dispatched
        │
        ▼
Consumers (idempotent)
```

Guarantee: an event is published **iff** its state change committed. At-least-
once delivery — consumers must be idempotent (§6).

---

## 5. Transport — Cloudflare Queues

- Platform async transport is **Cloudflare Queues** (Worker→Worker,
  Worker→Container, event fan-out, buffering, background jobs).
- **No Kafka** at baseline. Kafka/MSK is justified only later by: millions/
  billions of events, many independent consumers, long retention, stream
  processing, or analytics ingestion.
- AWS SQS is acceptable **only** for a workload that already lives in AWS
  ([15](15-infrastructure-and-iac.md) §escape hatch).

Do not build a Figentra queue abstraction that hides the transport. Define the
business **event contract** (`@figentra/events` types); let infrastructure pick
Queues (or SQS for an AWS workload).

---

## 6. Idempotent consumers & DLQ

- Every consumer is **idempotent** — processing the same event twice is a no-op.
  Dedupe on `event.id` (a processed-events table or an idempotency key).
- Every asynchronous subsystem has a **Dead Letter Queue**: queues, webhooks,
  events, notifications, integrations, workflows.
- DLQ operations: inspect → retry → replay → discard.
- Keep an **event archive** (not full event-sourcing) for replay, debugging,
  integration recovery, and audit correlation. R2 is a fit for cheap long-term
  retention ([14](14-data-and-persistence.md)).

```text
event → consumer fails (retries exhausted) → DLQ → inspect → retry/replay/discard
```

---

## 7. Workflows (R-7)

Three tiers, chosen by workload — **do not** prematurely build a bespoke
workflow engine.

```text
Simple async / fan-out / buffering / background job
        → Cloudflare Queues

Durable multi-step orchestration
(persisted state, per-step retries, long-running, human-in-the-loop pauses)
        → Cloudflare Workflows

Complex application-domain workflow API
(workflow / step / compensation model, pluggable engine)
        → @figentra/workflows   (backed by Cloudflare Workflows)
```

### 7.1 When to use which

| Need                                                       | Use                   |
| ---------------------------------------------------------- | --------------------- |
| Emit and forget; decouple producers/consumers; batch       | Cloudflare Queues     |
| Multi-step process where each step can retry independently | Cloudflare Workflows  |
| Long-running with pause/resume / human approval            | Cloudflare Workflows  |
| A domain workflow API with compensation (saga) semantics   | `@figentra/workflows` |

### 7.2 `@figentra/workflows`

A **domain API layer** — workflow / step / compensation (rollback) semantics,
inspired by the Medusa workflow SDK model — **backed by Cloudflare Workflows**,
not a self-hosted engine. Figentra is not made dependent on Medusa.

- **Workflow ≠ event.** A workflow **orchestrates work**; an event **announces a
  completed fact**. A workflow step may emit domain events; an event may trigger
  a workflow.
- Steps have compensation handlers for saga-style rollback on failure.
- The engine is replaceable; consumers depend on the `@figentra/workflows` API,
  not on the underlying runtime.

```text
Workflow: ProvisionTenant
  step 1: createBillingAccount        compensate: deleteBillingAccount
  step 2: seedDefaultEntitlements     compensate: revokeEntitlements
  step 3: grantDefaultAppAccess       compensate: revokeAccess
  step 4: assignDefaultDomain         compensate: releaseDomain
  (any step fails → run compensations in reverse)
```

---

## 8. Webhook platform

Outbound webhooks (Figentra → tenant/integration endpoints) are a first-class
async subsystem sharing the delivery + DLQ patterns:

```text
Webhook Endpoint → Subscription → Delivery → Retry → Signature → Replay → DLQ → Logs
```

- Signed payloads (HMAC signature header) so receivers can verify authenticity.
- Delivery tracking (success/failed/retries), replay, and DLQ.
- Inbound webhooks (third-party → Figentra) are verified + deduplicated at the
  edge ([07 §8], [17](17-security-and-compliance.md)).

---

## 9. Event-driven evolution

The platform is designed so services can be extracted later without redesign:

```text
tenant.created ──► IAM (seed roles) · Monetization (billing+subs) · Registry · Audit
subscription.updated ──► entitlement projection · application-access cache · billing · audit
```

Consumers subscribe to events they care about; producers never know their
consumers. This is what makes the "extract later" principle ([00 §6]) safe.

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                     | Correct                                                  |
| ------------------------------------------------ | -------------------------------------------------------- |
| Emitting an event for every action (incl. reads) | Only meaningful business state transitions; reads never. |
| Publishing events without the outbox             | Append to outbox in the aggregate's transaction.         |
| Non-idempotent consumers                         | Dedupe on `event.id`.                                    |
| Request/reply modeled as two events              | Synchronous HTTP ([09]).                                 |
| Building a custom workflow engine now            | Queues / CF Workflows / `@figentra/workflows` over CF.   |
| Confusing workflow with event                    | Workflow orchestrates; event announces.                  |
| Introducing Kafka by default                     | Cloudflare Queues; Kafka only when volume justifies it.  |
| A queue abstraction hiding the transport         | Define event contracts; let infra pick the transport.    |
| An async subsystem without a DLQ                 | Every async path has a DLQ + replay.                     |

---

## 11. Open questions

- Confirm outbox relay mechanism: polling relay vs. change-data-capture. Polling
  is simplest for the first NestJS services.
- Confirm the processed-events dedupe store (per-service table vs shared).
