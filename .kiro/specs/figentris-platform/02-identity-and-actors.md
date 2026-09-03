# 02 — Identity & Actors

**Status:** Baseline **Owner:** Identity plane / IAM **Related:**
[00 Overview](00-overview-and-principles.md),
[04 IAM](04-iam-and-authorization.md),
[09 Service communication](09-service-communication.md)

---

## 1. Purpose

Define who can act on the platform, how they authenticate, and how a validated
identity becomes a trusted request context. Identity answers **"who is the
actor?"** — never **"what may the actor do?"** (that is IAM,
[04](04-iam-and-authorization.md)) and never **"did the tenant buy it?"** (that
is Monetization, [05](05-monetization-and-billing.md)).

---

## 2. Identity provider — Supabase Auth

Supabase Auth is **authoritative** for human identity. Figentra never
re-implements what Supabase Auth owns.

**Supabase Auth owns:**

- User identity and profile
- Authentication (password, social, passwordless)
- Sessions and session tokens
- MFA
- SSO / SAML / OIDC (enterprise)
- Invitations
- Organization membership and basic organization roles

**Figentra must NOT build** (unless a specific future requirement forces it,
recorded as an ADR):

- Custom password storage
- Custom session management
- Custom MFA
- A custom OAuth identity provider
- A duplicate user store or org-membership engine

Integration with Supabase uses Supabase Auth's **current third-party auth
integration**, not the deprecated JWT-template approach (see
[14](14-data-and-persistence.md) §RLS).

---

## 3. The four actor types (R-8)

Every authenticated caller resolves to exactly one actor type. All four flow
through the **same IAM authorization model** — IAM does not care whether the
subject is a human or a machine; it evaluates permissions against a subject +
tenant + application + resource.

```text
                         ACTOR
                           │
     ┌──────────────┬──────┴───────┬───────────────────┐
     ▼              ▼              ▼                   ▼
   User      Service Account     System        Integration Actor
  (human)   (tenant automation) (platform svc) (installed integration)
     │              │              │                   │
     └──────────────┴──────┬───────┴───────────────────┘
                           ▼
                     IAM authorization
              (subject + tenant + application + resource)
```

| Actor type            | Represents                                               | Credential                                               | Scoped to              | Home spec                                           |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------------- | ---------------------- | --------------------------------------------------- |
| **User**              | A human                                                  | Supabase Auth session / JWT                              | Active org → tenant    | this doc                                            |
| **Service Account**   | Tenant-owned automation calling the API                  | Personal Access Token (PAT) or OAuth2 client-credentials | A tenant               | [04](04-iam-and-authorization.md) §Service accounts |
| **System**            | A platform service acting on its own behalf              | Short-lived service-identity token / CF binding          | The platform           | [09](09-service-communication.md)                   |
| **Integration Actor** | An installed third-party integration acting for a tenant | Scoped integration credentials (isolated)                | A tenant + integration | [07](07-integration-platform.md)                    |

### 3.1 Actor identity model

```text
actors
------
id                actor id (act_...)
type              user | service_account | system | integration
subject_ref       Supabase Auth subject id | service_account id | service name | integration installation id
tenant_id         nullable for system actors
display_name
status            active | disabled
created_at
updated_at
```

Service accounts and integration actors are **first-class rows** the tenant can
list, rotate, and revoke. System actors are platform-configured, not
tenant-managed.

---

## 4. Request identity context

Every authenticated request carries a derived, server-trusted context. The
reference `RequestIdentityContext` is extended to model all four actor types:

```typescript
interface RequestIdentityContext {
  // Who
  actorType: "user" | "service_account" | "system" | "integration";
  actorId: string; // act_...
  userId?: string; // Supabase Auth user id, when actorType = 'user'
  supabaseOrganizationId?: string; // when a user has an active org

  // Where
  tenantId?: string; // resolved, never client-supplied
  applicationKey?: string; // resolved from domain/route

  // What (populated by IAM, not by the caller)
  role?: string;
  permissions?: string[];

  // Trace
  requestId: string; // req_...
  traceId: string; // trace_...
}
```

**Trust rules (non-negotiable):**

1. `tenantId`, `applicationKey`, `role`, `permissions`, `supabaseOrganizationId`
   are **derived server-side** — from a validated Supabase Auth
   token/PAT/service token
   - trusted mappings (domain resolution, org→tenant mapping, IAM lookup).
2. The platform **never** trusts these values when supplied directly in a
   request body, query string, or non-authenticated header (`?tenantId=…`,
   `X-Tenant-Id`, `X-Role`, …).
3. Headers like `X-Tenant-Id` are only honored when produced by a **trusted
   upstream** over an authenticated service-to-service channel (see
   [09](09-service-communication.md) §Service identity).

---

## 5. Token strategy

Keep Supabase Auth session tokens **small**. Do not encode the whole platform
state into JWT custom claims.

**Good — minimal claims:**

```json
{ "sub": "user_123", "org_id": "org_456", "org_role": "admin" }
```

**Do NOT place in the JWT:** subscriptions, the full permission set (100+),
every application, every entitlement, tenant configuration, or billing data.

Reasons: token size, stale claims, revocation complexity, cookie/header limits,
and coupling. Dynamic platform state is fetched from IAM / Monetization / Tenant
at request time (with caching / projections where read volume demands it —
[04](04-iam-and-authorization.md) §Caching).

---

## 6. Multi-organization users

A user may belong to multiple Supabase Auth organizations. Authorization is
always evaluated against the **active** organization → tenant, never the bare
user id.

```text
Abdelrahman
├── Acme            → CRM = admin, POS = manager
└── Other Company   → CRM = viewer, Analytics = admin
```

The portal offers organization switching (Supabase Auth); switching the active
org re-resolves the tenant and the available applications
([03](03-tenancy-and-domains.md), [13](13-frontend-architecture.md)).

---

## 7. Authentication flow (user)

```text
User visits crm.figentra.com  (unauthenticated)
        │
        ▼
Redirect → identity.figentra.com/sign-in   (destination preserved)
        │
        ▼
Supabase Auth authentication → authenticated session
        │
        ▼
Determine active organization
        │
        ▼
Map organization → Figentra tenant       (trusted mapping)
        │
        ▼
Resolve application = crm                  (from hostname/route)
        │
        ▼
IAM: does the user have CRM access?
        │
        ▼
Return to original destination (crm.figentra.com/customers/123)
```

Destination preservation: if the user requested a deep link, return there after
auth rather than a generic dashboard.

---

## 8. Machine authentication (service accounts, integrations, system)

| Caller                | Mechanism                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Service account**   | PAT (opaque, hashed at rest) or OAuth2 client-credentials → short-lived access token. Scoped to the tenant + granted API scopes. |
| **Integration actor** | Credentials issued at install/connect time, isolated from the registry/frontend (see [07](07-integration-platform.md)).          |
| **System actor**      | Cloudflare service binding (Worker↔Worker) or short-lived service token (Container↔Container). Never a user token.               |

A user's Supabase Auth session token is **never** used as a machine-to-machine
credential.

---

## 9. Data ownership

| Concern                                  | Owner                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| Authentication / user identity           | Supabase Auth                                                  |
| Sessions / MFA / SSO                     | Supabase Auth                                                  |
| Supabase Auth org membership             | Supabase Auth                                                  |
| Actor registry (SA, integration, system) | IAM (with Tenant for SA ownership)                             |
| Request context derivation               | API Gateway + platform SDK ([09](09-service-communication.md)) |

---

## 10. Non-goals / anti-patterns

| Anti-pattern                                                    | Correct                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Building a password / session / MFA store                       | Supabase Auth owns it.                                         |
| Trusting `?tenantId=` or `X-Role` from the browser              | Derive server-side from validated identity + trusted mappings. |
| Fat JWT with all permissions/entitlements                       | Minimal claims; fetch dynamic state from services.             |
| Using a user's Supabase Auth token for service-to-service calls | Use service identity.                                          |
| Authorizing by bare `userId`                                    | Authorize by actor + active tenant + application.              |
| Modeling only `userId` and ignoring machine actors              | Model all four actor types uniformly.                          |

---

## 11. Open questions

- **O-2** — Is the Supabase Auth org ↔ tenant relationship strictly 1:1 at
  launch, or do we allow 1:N early? Affects the mapping table and the org
  switcher UX (see [03](03-tenancy-and-domains.md)).
