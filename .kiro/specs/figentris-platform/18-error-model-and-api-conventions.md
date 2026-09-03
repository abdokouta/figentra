# 18 — Error Model & API Conventions

**Status:** Baseline **Owner:** Platform architecture (`@figentra/contracts`)
**Related:** [08 API Gateway](08-api-gateway.md),
[12 Versioning](12-versioning.md),
[09 Service communication](09-service-communication.md)

---

## 1. Purpose

Define the cross-platform API conventions every service and application follows:
error envelope + codes, ID scheme, pagination, idempotency, and request context
headers. These live in `@figentra/contracts`.

---

## 2. Error envelope

All platform APIs return a consistent error shape:

```json
{
  "error": {
    "code": "APPLICATION_ACCESS_DENIED",
    "message": "The user does not have access to this application.",
    "requestId": "req_123",
    "details": {}
  }
}
```

- `code` — a stable, machine-readable enum ([§3]).
- `message` — human-readable; safe to surface; never leaks secrets/PII.
- `requestId` — correlation id ([08 §8]) for support/tracing.
- `details` — optional structured context (e.g. validation field errors).

HTTP status maps to the code category ([§4]).

---

## 3. Error codes

Canonical categories (extensible per domain, but these are the shared base):

```text
AUTHENTICATION_REQUIRED       AUTHENTICATION_INVALID
TENANT_NOT_FOUND              TENANT_SUSPENDED
APPLICATION_NOT_FOUND         APPLICATION_DISABLED       APPLICATION_ACCESS_DENIED
PERMISSION_DENIED             ENTITLEMENT_REQUIRED       SUBSCRIPTION_INACTIVE
DOMAIN_NOT_VERIFIED           VALIDATION_ERROR
RESOURCE_NOT_FOUND            CONFLICT
RATE_LIMITED                  INTERNAL_ERROR
```

Note the deliberate split (matches the platform's separation of concerns):

- `PERMISSION_DENIED` — IAM said no ([04]).
- `ENTITLEMENT_REQUIRED` — Monetization capability missing ([05]).
- `SUBSCRIPTION_INACTIVE` — billing state blocks it ([05]).

---

## 4. HTTP status mapping

| Status | Codes                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                                                                                                                          |
| 401    | `AUTHENTICATION_REQUIRED`, `AUTHENTICATION_INVALID`                                                                                         |
| 402    | `SUBSCRIPTION_INACTIVE` (payment required, where used)                                                                                      |
| 403    | `PERMISSION_DENIED`, `ENTITLEMENT_REQUIRED`, `APPLICATION_ACCESS_DENIED`, `TENANT_SUSPENDED`, `APPLICATION_DISABLED`, `DOMAIN_NOT_VERIFIED` |
| 404    | `TENANT_NOT_FOUND`, `APPLICATION_NOT_FOUND`, `RESOURCE_NOT_FOUND`                                                                           |
| 409    | `CONFLICT`                                                                                                                                  |
| 410    | version removed ([12 §5])                                                                                                                   |
| 429    | `RATE_LIMITED`                                                                                                                              |
| 500    | `INTERNAL_ERROR`                                                                                                                            |

The `X-Application-Id` resolution errors from the reference map here: missing →
400 `VALIDATION_ERROR`; unknown → 404 `APPLICATION_NOT_FOUND`; disabled → 403
`APPLICATION_DISABLED`.

---

## 5. ID scheme

Domain-prefixed, URL-safe identifiers:

```text
usr_   org_(Supabase Auth)   ten_   app_   role_   perm_   sub_   plan_   ent_
dom_   bacc_   intg_  intgi_  intgc_  act_   grant_  pol_   inv_   cred_
evt_   obx_   req_   trace_  price_  prod_

# Service-plane aggregates (registered with the 8 service scaffolds):
ntf_   chan_   ntpl_   npref_        # notifications
wf_    wfr_                          # workflows (+ obx_ outbox, evt_ event)
apr_   apd_                          # approval
rpt_   rptr_                         # reporting
sidx_  sq_                           # search
whs_   whe_   whd_                   # webhook
# audit: audit-log reuses evt_; activity-log + retention-policy prefixes pending
```

Rules:

- Prefix names the domain; body is a collision-resistant unique id (e.g. UUID/
  ULID-style).
- **Supabase Auth IDs are never renamed** (`user_...`, `org_...`); a Figentra
  tenant maps a Supabase Auth `org_...` to a `ten_...` ([03 §2]).
- IDs are opaque to clients — never parse structure out of the body.
- **Service-plane prefixes** (Notifications, Workflows, Approval, Reporting,
  Search, Webhook) are registered above alongside the control-plane set; each
  new aggregate claims a distinct prefix. Known micro-gap: the Audit service's
  `audit-log` currently reuses `evt_`, and `activity-log` + `retention-policy`
  have no dedicated prefix yet — assign `alog_` / `retpol_` (and give audit-log
  a dedicated `aud_`) when the Audit data model lands.

---

## 6. API versioning

- Public APIs: `/api/v1/...` (URL versioning, [12 §3]).
- New major = new surface, not an in-place break.
- Deprecation/sunset via `Deprecation` + `Sunset` headers ([12 §5]).

---

## 7. Pagination, filtering, sorting

Conventions for list endpoints (exact shape in `@figentra/contracts`):

```text
GET /v1/customers?limit=50&cursor=<opaque>&sort=-createdAt&filter[status]=active
```

- **Cursor-based** pagination preferred for large/most collections; response
  carries `nextCursor`.
- Consistent `limit` bounds; server caps the max.
- Filtering/sorting are explicit, allow-listed per resource (no arbitrary SQL
  surface).

Illustrative list response:

```json
{ "data": [/* ... */], "page": { "nextCursor": "...", "limit": 50 } }
```

---

## 8. Idempotency

- Mutating operations that create resources or move money accept an
  **`Idempotency-Key`** header; the server dedupes retries ([05 §9], [10 §8]).
- Event consumers dedupe on `event.id` ([11 §6]).
- Webhooks (inbound + outbound) are idempotent + signature-verified ([11 §8]).

---

## 9. Request context headers

| Header                      | Meaning                                   | Trust                                   |
| --------------------------- | ----------------------------------------- | --------------------------------------- |
| `Authorization: Bearer ...` | Supabase Auth token / PAT / service token | Validated at edge + service             |
| `Idempotency-Key`           | Client-supplied dedupe key for mutations  | Client-supplied, server-enforced        |
| `X-Figentra-Request-Id`     | Correlation id (`req_...`)                | Assigned/propagated by gateway          |
| `X-Figentra-Service`        | Calling service identity                  | Only over authenticated service channel |
| `Deprecation` / `Sunset`    | Version lifecycle (response)              | Server-set ([12])                       |

Never trust `X-Tenant-Id` / `X-User-Id` / `X-Role` from an unauthenticated
source ([17 §3]).

---

## 10. Contract-first

- OpenAPI + JSON Schema + TypeScript types live in `@figentra/contracts`,
  organized by domain (`.../auth`, `.../iam`, `.../tenant`, `.../monetization`,
  `.../application`, `.../events`).
- Share **contracts**, never persistence models ([09 §8]).
- The error envelope, ID scheme, pagination, and headers here are part of the
  shared contract.

---

## 11. Non-goals / anti-patterns

| Anti-pattern                                      | Correct                                                         |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Ad-hoc error shapes per service                   | One error envelope + shared codes.                              |
| Leaking secrets/PII in error messages             | Safe messages; details redacted.                                |
| Parsing structure out of an ID body               | IDs are opaque; prefix indicates domain only.                   |
| Renaming Supabase Auth IDs                        | Keep Supabase Auth IDs; map to `ten_` on the tenant record.     |
| Offset pagination for large collections           | Cursor-based pagination.                                        |
| Arbitrary client-driven filter/sort (SQL surface) | Allow-listed filters/sorts per resource.                        |
| Non-idempotent create/payment endpoints           | `Idempotency-Key` + server dedupe.                              |
| Trusting identity headers from the client         | Server-derived context; service headers only over auth channel. |

---

## 12. Open questions

- Confirm cursor vs. page-number pagination default for admin/list-heavy UIs.
- Confirm whether `402 SUBSCRIPTION_INACTIVE` is used or folded into `403`.
