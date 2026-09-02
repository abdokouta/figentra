# 17 — Security & Compliance

**Status:** Baseline (security principles), Deferred (formal compliance programs)
**Owner:** Platform security
**Related:** [02 Identity](02-identity-and-actors.md), [04 IAM](04-iam-and-authorization.md), [14 Data](14-data-and-persistence.md), [09 Service communication](09-service-communication.md)

---

## 1. Purpose

Consolidate the mandatory security rules, the quotas-vs-limits distinction, and
the compliance posture. Many rules restate constraints enforced in their home
specs — this doc is the single security checklist.

---

## 2. Mandatory security rules

1. Never trust tenant IDs from the frontend.
2. Never trust organization IDs from arbitrary request bodies.
3. Always validate Supabase Auth identity (or PAT/service token) server-side.
4. Resolve tenant through a **trusted mapping**, never client input ([03]).
5. Enforce authorization **server-side** ([04]); UI checks are not a boundary.
6. Use Supabase **RLS** as defense-in-depth ([14 §5]).
7. Keep JWT claims **small** ([02 §5]).
8. Do not store secrets in source code.
9. Use environment/secret management ([15 §9]); never commit secrets.
10. Log authorization failures **without** leaking sensitive data.
11. Use correlation/request IDs on every request ([08 §8]).
12. Audit administrative/security actions ([§7]).
13. Do not expose internal service endpoints publicly unless required.
14. Apply rate limiting at the edge ([08 §6]).
15. Validate **all** external webhook signatures ([11 §8], [07 §8]).
16. Use **idempotency** for billing/payment operations ([05 §9]).
17. Applications must not directly mutate platform-owned data ([09 §3]).

---

## 3. Trust boundaries

```text
UNTRUSTED                          TRUSTED (server-derived)
request body / query / headers  →  RequestIdentityContext ([02 §4])
  ?tenantId=, X-Tenant-Id,          actorId, tenantId, applicationKey,
  X-Role, X-User-Id                 role, permissions
```

Client-supplied identity context is **never** trusted. `X-Figentra-Service` /
`X-Figentra-Request-Id` are honored **only** over an authenticated
service-to-service channel ([09 §4]).

---

## 4. Service-to-service security

- A user's Supabase Auth token is never a machine credential ([09 §4]).
- Service identity via (in order): Cloudflare service bindings → short-lived
  service credentials over private HTTPS → mTLS/workload identity → long-lived
  static secrets (last resort).
- **Least privilege** service scopes; no `*` / `admin` / `root` except a tightly
  controlled infrastructure/system actor ([04 §8], [09 §4.2]).

---

## 5. Permission / Entitlement / Quota / Rate limit / Usage

Five distinct controls; conflating them is a security + billing bug
([05 §6], [04 §3]):

```text
Permission  IAM         can the actor do the action?
Entitlement Monetization did the tenant buy the capability?
Quota       Monetization how much per period?
Rate limit  Gateway/edge how fast?
Usage       Monetization how much consumed?
```

---

## 6. Domain & billing security

- **Custom domains**: verify ownership (DNS TXT / HTTP) before activating any
  routing or certificate ([03 §6]).
- **Billing**: every payment operation is idempotent and tolerant of provider
  retries; webhook signatures verified; `idempotency_key` /
  `provider_event_id` / `external_event_id` prevent duplicate processing
  ([05 §9]).

---

## 7. Audit

- Administrative and security-relevant actions produce **audit events** — a
  stream distinct from domain events ([11 §2], [16 §2]).
- Audit records: actor, action, resource, tenant, timestamp, correlation id,
  outcome. Immutable; longer retention than operational logs.
- Covered actions: IAM changes (`role.created`, `access.granted/revoked`),
  tenant lifecycle, billing events, domain changes, impersonation/support
  sessions ([§10]).

---

## 8. Abuse & edge security

Cloudflare handles much edge security (WAF, DDoS, bot mitigation); Figentra
still owns **application-level** abuse policy:

```text
IP reputation · bot detection · suspicious login · API abuse
rate-limit violations · credential compromise · tenant-isolation violations
```

Application-level abuse controls are **P1/P2**; edge protections (Cloudflare WAF
+ edge rate limiting) are baseline.

---

## 9. Encryption & key management

**Status: Deferred depth.** Use Cloudflare / cloud-provider secret + KMS
facilities; do not build a bespoke KMS. Future: tenant encryption, credential
encryption, key rotation. Baseline: secrets at rest in the secret store,
TLS in transit (Cloudflare), no secrets in code/logs.

---

## 10. Support & impersonation

Enterprise support access is controlled and audited — never silent:

```text
Support request → approval → temporary, time-boxed session → everything audited
```

Never `admin → silently impersonate`. Impersonation/support sessions are
time-boxed, approval-gated, and fully audited. This is a **P1/P2** capability;
the audit + time-boxed-grant primitives exist at baseline ([04] access_grants
`expires_at`, [§7]).

---

## 11. Compliance posture

**Status: Deferred programs; architecture-ready.**

Do not build certification machinery now, but the architecture supports:

| Regime            | Architectural hooks                                                        |
| ----------------- | -------------------------------------------------------------------------- |
| GDPR / CCPA       | Data lifecycle, erasure, export, data residency ([14 §7-9]), audit.        |
| SOC 2 / ISO 27001 | Audit trail, access reviews, least privilege, change control ([19]).       |
| PCI-DSS           | Payments behind a processor adapter; no card data in Figentra ([05 §9]).  |

Supporting capabilities (P1/P2): **access reviews** (periodic review of who has
production/admin access → review/approve/revoke/expire), **data export/import**,
**data lifecycle** enforcement ([14 §9]), **SCIM/SSO enterprise provisioning**
(Supabase Auth-backed identity; Figentra maps enterprise org membership into its
IAM/tenant model).

---

## 12. Non-goals / anti-patterns

| Anti-pattern                                                | Correct                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| Trusting client-supplied tenant/user/role                   | Server-derived context only.                                |
| UI permission hiding treated as security                    | Server-side authorization is the boundary.                  |
| Wildcard service credentials                                | Least-privilege scopes.                                     |
| Secrets in code / logs / registry / manifest                | Secret store; redact logs.                                  |
| Silent impersonation                                        | Approval + time-boxed + audited.                            |
| Storing card data in Figentra                              | Processor adapter (Stripe/Paddle); PCI scope minimized.     |
| Unverified webhooks / non-idempotent billing                | Verify signatures; idempotency keys.                        |
| Building a bespoke KMS                                       | Use Cloudflare/cloud KMS facilities.                        |

---

## 13. Open questions

- Which compliance regime is the first formal target (drives when access
  reviews / export / SCIM promote from deferred)?
- Confirm SSO/SCIM enterprise-provisioning requirements at launch vs later.
