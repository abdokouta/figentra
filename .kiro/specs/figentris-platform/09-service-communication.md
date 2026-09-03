# 09 — Service Communication

**Status:** Baseline **Owner:** Platform architecture **Related:**
[08 API Gateway](08-api-gateway.md),
[11 Events & workflows](11-events-and-workflows.md),
[17 Security](17-security-and-compliance.md)

---

## 1. Purpose

Service-to-service communication is a **first-class** architectural concern.
This spec defines synchronous vs asynchronous choice, service identity,
Cloudflare-native transport, and the shared SDK. Data-level rules (never touch
another service's DB) are enforced here and in [14](14-data-and-persistence.md).

---

## 2. Synchronous vs asynchronous

**Synchronous (HTTP/REST)** — the caller needs an immediate answer:

```text
Can this user access CRM?              (→ IAM)
Does this tenant have entitlement X?    (→ Monetization)
What is the current tenant config?      (→ Tenant)
What applications exist?                (→ Registry)
```

**Asynchronous (events/Queues)** — the result need not block the request:

```text
usage.recorded          subscription.updated       tenant.created
audit.recorded          email.send                 webhook.deliver
entitlement.changed     application.enabled         domain.verified
```

Rule of thumb: if the caller must act on the answer **now**, call synchronously;
if it is announcing that something **happened**, emit an event.

---

## 3. Data boundary (mandatory)

A service communicates with another service's **API or event stream**, never its
database.

```text
BAD                                 GOOD
CRM ──writes──► IAM DB              CRM ──calls──► IAM API
                                    CRM ──emits──► event
```

Read-heavy authorization may use **event-fed projections/caches** (e.g. an
application-access cache), but ownership stays explicit: the projection is a
read optimization, never a second source of truth ([04 §9]).

---

## 4. Service identity (never the user's token)

A user's Supabase Auth session token is **never** a machine-to-machine
credential. Separate user context from service context:

```text
USER CONTEXT                       SERVICE CONTEXT
userId                             callingService
supabaseOrganizationId                serviceIdentity
tenantId                           requestedOperation
application                        traceId
roles / permissions
```

A service request may carry **both**, and the receiving service validates both
layers:

```json
{
  "subject": {
    "userId": "user_123",
    "tenantId": "ten_123",
    "application": "commerce"
  },
  "caller": { "service": "portal" }
}
```

### 4.1 Service identity mechanisms (in order of preference)

1. **Cloudflare service bindings** — Worker→Worker, when both sides are Workers
   and a direct binding is appropriate. No public routing, explicit dependency.
2. **Short-lived service credentials over private/internal HTTPS** —
   Container→Container.
3. **mTLS / stronger workload identity** — when a future security boundary
   requires it.
4. **Long-lived static secrets** — last resort only.

Never send `X-Service-Secret: admin` as the sole authorization mechanism.

### 4.2 Service scopes (least privilege)

Explicit, least-privilege scopes per calling service:

```text
portal   → tenant.read, iam.authorization.read, monetization.subscription.read
commerce → iam.authorization.check, monetization.entitlement.read, audit.write, usage.write
billing  → tenant.read, audit.write, usage.read
```

No service receives `*` / `admin` / `root` unless it is a tightly controlled
infrastructure/system actor. Trusted headers (`X-Figentra-Service`,
`X-Figentra-Request-Id`) are honored only over an authenticated service channel;
`X-Tenant-Id` / `X-User-Id` / `X-Role` are trusted only from a verified
upstream.

---

## 5. Cloudflare-native transport

Keep Cloudflare-native communication inside Cloudflare where practical.

```text
Worker Gateway
   ├── service binding → Worker Registry
   ├── service binding → other Worker services
   └── Worker-in-front → Container service (IAM / Tenant / Monetization)
```

- **Worker → Worker:** service bindings (preferred over public HTTP).
- **Worker → Container:** the canonical path — a Worker sits in front of the
  Container; the Worker handles edge concerns, the Container handles business
  logic. Containers may reach configured Worker bindings through outbound
  handlers.

```text
Client → Worker (edge: routing/auth/rate-limit/request-id) → Container (NestJS business logic)
```

Do not use service bindings as an excuse to couple everything — domain
boundaries stay intact.

---

## 6. Event envelope

All platform events use one standard envelope (detail + delivery guarantees in
[11](11-events-and-workflows.md)):

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

Events are **versioned, idempotently processed, traceable, tenant-aware**, and
backward-compatible where possible.

---

## 7. The platform SDK

Services and frontends do not re-implement Supabase Auth parsing + tenant
resolution + IAM logic. Shared client packages provide it:

```text
@figentra/auth                 authenticated user / active org / resolve tenant
@figentra/iam-client           checkPermission / requirePermission
@figentra/tenant-client        resolveTenant / tenant config
@figentra/monetization-client  getEntitlement / requireEntitlement
@figentra/platform-sdk         umbrella client
```

SDK surface:

```typescript
getAuthenticatedUser();
getActiveOrganization();
resolveTenant();
checkPermission();
requirePermission();
getEntitlement();
requireEntitlement();
```

The SDK is a **client/contract layer only** — it never embeds a second
authorization database. Contracts (types) come from `@figentra/contracts`
([12](12-versioning.md), [18](18-error-model-and-api-conventions.md)).

---

## 8. Contract-first

- Share **contracts**, never persistence models.
- `@figentra/contracts` holds OpenAPI + JSON Schema + TypeScript types per
  domain (`.../auth`, `.../iam`, `.../tenant`, `.../monetization`,
  `.../application`, `.../events`).
- Internal contracts may evolve faster than public ones but are still explicit
  and versioned.

---

## 9. Non-goals / anti-patterns

| Anti-pattern                                                   | Correct                                                |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| Using the user's Supabase Auth token for service→service calls | Service identity (bindings / short-lived creds).       |
| A service reading another service's DB                         | API call or event-fed projection.                      |
| `X-Service-Secret: admin` as the only auth                     | Scoped service identity over an authenticated channel. |
| Wildcard service scopes                                        | Least-privilege explicit scopes.                       |
| Request/reply built on two events + correlation id             | Use synchronous HTTP for request/reply.                |
| Sharing DB entities between services                           | Share contracts (`@figentra/contracts`).               |
| Coupling every service via bindings                            | Bindings within domain boundaries only.                |

---

## 10. Open questions

- Confirm the container↔container service-credential mechanism (short-lived JWT
  issuer vs mTLS) for the initial three NestJS services.
