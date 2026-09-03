# 04 — IAM & Authorization

**Status:** Baseline **Owner:** IAM service **Runtime:** Cloudflare Container +
NestJS · **Store:** Supabase PostgreSQL **Related:**
[02 Identity & actors](02-identity-and-actors.md),
[05 Monetization](05-monetization-and-billing.md),
[17 Security](17-security-and-compliance.md)

---

## 1. Purpose

IAM answers exactly one question:

> **Is this actor allowed to perform this action on this resource?**

It does **not** answer "who is the actor?" (Supabase Auth,
[02](02-identity-and-actors.md)) or "did the tenant purchase this capability?"
(Monetization, [05](05-monetization-and-billing.md)). These are separate checks
and both may be required on a single request.

---

## 2. Responsibilities

**IAM owns:**

- Platform roles and application roles
- Permissions and role↔permission relationships
- Role assignment (to users, service accounts, integration actors)
- Application access (which actors can access which application in a tenant)
- Authorization decisions and evaluation
- Access policies (contextual authorization / policy engine)
- The service authorization API used by every other service
- The actor registry for service accounts + integration actors (ownership shared
  with Tenant for SA→tenant)

**IAM does NOT own:**

- Authentication, sessions, MFA (Supabase Auth)
- Subscription/entitlement state (Monetization)
- Application business rules (each application)

---

## 3. Permission vs Entitlement (mandatory distinction)

|          | IAM Permission                              | Entitlement                                           |
| -------- | ------------------------------------------- | ----------------------------------------------------- |
| Question | Is the **actor** allowed to do this action? | Has the **tenant** purchased/enabled this capability? |
| Scope    | actor + tenant + application + resource     | tenant + application                                  |
| Example  | `crm.customer.delete`                       | `crm.ai = true`, `crm.max_users = 500`                |
| Owner    | IAM                                         | Monetization                                          |

```text
Request
   │
   ▼
IAM        "Can the actor do this?"          → permission check
   │
   ▼
Entitlement "Does the tenant have this?"     → capability check (Monetization)
   │
   ▼
Application "Is the operation valid?"         → business validation
```

Both checks may be required. A user with `crm.ai.use` permission still cannot
use AI if the tenant lacks the `crm.ai` entitlement, and vice versa.

---

## 4. Data model

Logical model (physical schema may simplify; do not create tables a use case
does not need):

```text
roles
-----
id            role_...
key           e.g. crm:admin
name
scope         platform | application
application_id nullable (null for platform roles)
system        bool (built-in, non-deletable)
tenant_id     nullable (null = global/system role; set = tenant-custom role)
created_at
updated_at
```

```text
permissions
-----------
id            perm_...
key           e.g. crm.customer.delete
name
description
application_id nullable
created_at
updated_at
```

```text
role_permissions
----------------
role_id
permission_id
```

```text
access_grants                     -- an actor's role within a tenant/application
-------------
id            grant_...
actor_id      act_...   (user | service_account | integration)
tenant_id     ten_...
application_id nullable (null = platform-level grant)
role_id       role_...
created_at
expires_at    nullable (time-boxed grants)
created_by
```

```text
access_policies                   -- contextual authorization rules (see §7)
---------------
id            pol_...
name
application_id nullable
effect        allow | deny
resource      e.g. commerce.order
action        e.g. refund
condition     JSON predicate (amount, ownership, time, risk, approval-state, ...)
priority      int
created_at
updated_at
```

Naming conventions:

- **Permission key:** `<application>.<resource>.<action>` — `crm.customer.read`,
  `commerce.order.refund`, `iam.role.assign`.
- **Role key:** `<scope>:<name>` — `crm:admin`, `platform:support`.

---

## 5. Roles

Two role scopes:

- **Platform roles** (`scope = platform`, `application_id = null`) — e.g.
  `platform:support`, `platform:admin`. Assigned to platform staff / system
  actors, not to ordinary tenant users.
- **Application roles** (`scope = application`) — e.g. `crm:admin`,
  `crm:viewer`, `commerce:manager`. Assigned to actors within a tenant.

Roles are either **system** (`system = true`, built-in, non-deletable, defined
by the application manifest — see [06](06-application-registry.md)) or
**tenant-custom** (`tenant_id` set), where custom-role creation is itself gated
by an entitlement (`custom_roles = true`, quota `custom_role_slot`).

Example:

```text
User: user_123   Tenant: ten_123   Application: crm
Role: crm:admin
Permissions:
  crm.customer.read
  crm.customer.create
  crm.customer.update
  crm.customer.delete
```

---

## 6. Authorization decision flow

```text
Request (POST /orders on commerce.figentra.com)
   │
   ▼
API Gateway — validate identity (Supabase Auth/PAT/service token)
   │
   ▼
Resolve tenant (org→tenant mapping / domain resolution)
   │
   ▼
Resolve application = commerce
   │
   ▼
IAM: POST /v1/authorization/check
   subject: {actorId, tenantId, application}
   permission: commerce.order.create
   resource:  {orderId?, ownerId?, amount?}
   │
   ├── evaluate access_grants → role → role_permissions
   ├── evaluate access_policies (contextual, §7)
   ▼
{ allowed: true | false, reason }
   │
   ▼ (if allowed)
Entitlement check (Monetization): commerce.orders.enabled?
   │
   ▼ (if entitled)
Commerce business validation → DB write (tenant-isolated)
```

### 6.1 Authorization API

```text
POST /v1/authorization/check
{
  "subject":  { "actorId": "act_1", "tenantId": "ten_1", "application": "commerce" },
  "permission": "commerce.order.create",
  "resource": { "orderId": "ord_9", "amount": 250 }
}
→ { "allowed": true }

GET  /v1/me/access                       -- effective access for the caller
GET  /v1/tenants/:tenantId/applications  -- apps the tenant can access
POST /v1/roles
POST /v1/roles/:id/permissions
POST /v1/access/grants
DELETE /v1/access/grants/:id
GET  /v1/permissions
```

The platform SDK ([09](09-service-communication.md) §SDK) wraps these:
`checkPermission()`, `requirePermission()`, `getEntitlement()`,
`requireEntitlement()`.

---

## 7. Policy engine (contextual authorization)

Role/permission checks answer coarse "can this actor do X". Some decisions need
**context**: ownership, amount, time, location, risk, approval state.

```text
Can user X refund order Y?
   depends on: role · tenant · resource · ownership · amount · time · risk · approval_state
```

Policies are declarative rows evaluated after the base permission check:

```text
refund ≤ $500              → allowed for role commerce:manager
refund >  $500             → requires finance approval (deny → route to Approval)
```

Policy evaluation:

1. Base permission check passes (`commerce.order.refund`).
2. Matching `access_policies` are evaluated by `priority`.
3. First explicit `deny` wins; otherwise `allow`.
4. A policy may return `requires_approval`, which hands off to the Approval
   capability (P1, [20](20-implementation-roadmap.md)) rather than a hard deny.

The policy engine is a P1 capability; v1 ships role/permission checks. The
`access_policies` table and the `condition` predicate shape are defined now so
the policy engine slots in without a data migration.

---

## 8. Service accounts & integration actors in IAM

- **Service accounts** are actors (`type = service_account`) scoped to a tenant,
  granted roles via `access_grants`, and authenticated by PAT / OAuth2
  client-credentials ([02](02-identity-and-actors.md) §8). Their permissions are
  the **intersection** of granted roles and the token's requested scopes.
- **Integration actors** (`type = integration`) receive least-privilege grants
  defined by the integration's manifest and the tenant's configuration at
  install time ([07](07-integration-platform.md)).

Least privilege is mandatory — no actor receives `*` / `admin` / `root` unless
it is a tightly controlled infrastructure/system actor.

---

## 9. Caching & projections

Authorization is on the hot path. To avoid an IAM round-trip per request:

- The gateway/SDK may cache `GET /v1/me/access` per (actor, tenant) with a short
  TTL and explicit invalidation on `access.granted` / `access.revoked` /
  `subscription.updated` events.
- High-read authorization may use an **event-fed projection** (e.g. an
  "application access cache" updated from `subscription.updated` and grant
  events). Ownership stays with IAM/Monetization; the projection is a read
  optimization, never a second source of truth.

---

## 10. Events

**Emitted:** `role.created`, `role.updated`, `permission.created`,
`access.granted`, `access.revoked`.

**Consumed:** `tenant.created` (seed default roles/grants for the tenant),
`application.enabled` (grant default application roles), `subscription.updated`
/ `entitlement.changed` (invalidate access caches).

---

## 11. Non-goals / anti-patterns

| Anti-pattern                                                | Correct                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Merging permission and entitlement checks                   | Two independent checks (IAM + Monetization).                          |
| Hard-coding subscription plans in application authorization | Applications ask IAM for permissions + Monetization for entitlements. |
| Storing all permissions in the Supabase Auth JWT            | Fetch effective access from IAM (cached).                             |
| Granting `*` / `admin` to a service                         | Least privilege; explicit scopes.                                     |
| Application writing IAM tables directly                     | Call the IAM API / emit events.                                       |
| A second authorization store inside the SDK                 | The SDK is a client; IAM is authoritative.                            |

---

## 12. Open questions

- Confirm whether tenant-custom roles ship in v1 or are deferred to v1.1
  (affects the `roles.tenant_id` + custom-role entitlement path).
- Confirm the initial permission catalog per application (owned by each
  application's manifest, aggregated by IAM).
