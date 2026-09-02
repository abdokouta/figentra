---
authored_by: kiro
authored_at: 2026-08-13
source: prompt://auth-tenancy-enterprise-alignment
reviewed_by: null
reviewed_at: null
---

# Auth-tenancy composition — the layering rule

> **ADR anchor.** Codified by ADR-0090 — Auth-tenancy optional composition
> layering. This steering is the enforceable surface of that ADR.

Rules for how the workspace's auth stack and tenancy stack compose. Applies to
every consumer app that ships either `@stackra/auth` OR `@stackra/auth` +
`@stackra/tenancy`. Applies to every backend service that consumes
`@stackra/auth` and/or `@stackra/tenancy`.

Read alongside:

- [`.kiro/plans/2026-08-13-auth-tenancy-enterprise-alignment.md`](../plans/2026-08-13-auth-tenancy-enterprise-alignment.md)
  — the plan this steering codifies.
- [`subpath-layering.md`](subpath-layering.md) — the frontend subpath
  dependency-direction rule (`core` → `react` → `native`); this doc is its
  package-level sibling for the auth+tenancy pair.
- [`contract-implementer-split.md`](contract-implementer-split.md) — the
  light-tier vs heavy-tier pattern this composition rule builds on.

## Precedence

1. This file wins over generic "how do auth + tenancy interact" guidance.
2. When this file and a specific package README disagree, this file wins.
3. Cross-references in this doc win for their specific concerns.

## The layering rule (locked)

Two layers, one direction:

```
┌─ Layer 2 — Tenancy (optional, additive) ────────────────┐
│   @stackra/tenancy                                       │
│                                                          │
│   Adds on TOP of Layer 1:                                │
│     - TenantGate (guards subtrees on host classification)│
│     - WorkspacePickerPage + useMyWorkspaces              │
│     - Cross-subdomain exchange (fragment-code round-trip)│
│     - Backend: findTenants + publicShowTenantBySlug      │
│                                                          │
│   ┌─ Layer 1 — Auth (required, standalone) ─────────┐    │
│   │   @stackra/auth · @stackra/auth-ui                │    │
│   │   @stackra/authorization · @stackra/identity      │    │
│   │   @stackra/rbac                                    │    │
│   │                                                    │    │
│   │   Compiles + runs WITHOUT tenancy.                 │    │
│   └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Rule 1 — `@stackra/auth` has no peer on `@stackra/tenancy`

The auth package builds + tests + runs against zero tenancy imports. No
`peerDependencies` entry, no `optionalDependencies` entry, no
`peerDependenciesMeta.optional` entry.

```jsonc
// frontend/identity/src/auth/package.json — CORRECT shape
{
  "peerDependencies": {
    "@stackra/contracts": "workspace:^",
    "@stackra/container": "workspace:^",
    "@stackra/http": "workspace:^",
    // ... NO @stackra/tenancy anywhere
  },
}
```

Enforcement grep — zero hits required:

```sh
grep -E '"@stackra/tenancy"' \
  frontend/identity/src/auth/package.json
```

Same for backend:

```sh
grep -E '"@stackra/tenancy"' \
  backend/auth/package.json
```

## Rule 2 — `@stackra/auth-ui` treats `@stackra/tenancy` as an OPTIONAL peer

The UI package DOES compose the workspace picker page + returnUrl plumbing that
tenancy-enabled deploys use. But every tenancy-reaching call site uses
`useOptionalInject` so the module still boots when tenancy isn't installed.

```jsonc
// frontend/identity/src/auth-ui/package.json — CORRECT shape
{
  "peerDependencies": {
    "@stackra/tenancy": "workspace:^",
    // ...
  },
  "peerDependenciesMeta": {
    "@stackra/tenancy": { "optional": true },
  },
}
```

Every consumer that ships auth-ui WITHOUT tenancy sees:

- The workspace-picker page still exists but renders the `tenancy_unavailable`
  fallback state ("Workspace switching isn't available on this deployment. Ask
  your operator to enable @stackra/tenancy.").
- Every other form (login, register, forgot-password, mfa-challenge, ...) works
  exactly as if tenancy were installed.

Enforcement — any tenancy-reaching call in auth-ui MUST use
`useOptionalInject<T>` from `@stackra/container/react`:

```typescript
// ✅ CORRECT
const service = useOptionalInject<ITenancyService>(TENANCY_SERVICE);
if (!service) return <TenancyUnavailableState />;

// ❌ WRONG — throws when tenancy is absent
const service = useInject<ITenancyService>(TENANCY_SERVICE);
```

## Rule 3 — `<TenantGate>` wraps `<AuthGate>`, never the reverse

> **ADR anchor.** The gate ordering is codified below. The declarative
> route-prop path that removes the manual wrap boilerplate is codified by
> ADR-0096 — Declarative route guards via `@stackra/routing` registry. The
> ordering guarantee holds in BOTH paths; the declarative path enforces it
> structurally via the registry's `order` field.

Order matters when both gates apply. Tenancy resolves FIRST (host
classification: Central → picker; Tenant → pass; CentralAdmin → pass), THEN auth
resolves (authenticated? redirect to login).

**Preferred — declarative via route props (ADR-0096):**

```tsx
// ✅ PREFERRED — routing package composes gates in registry order.
defineRoute({
  path: "/",
  tenanted: true, // shorthand for guards: ["auth", "tenant"]
  Component: AppShell,
});

// Bootstrap once — routing enforces §Rule 3's ordering via order: 10 vs 20.
routingModule.registerGuard("tenant", {
  Component: TenantGate,
  props: { redirectTo: WORKSPACE_PICKER_PATH },
  order: 10, // outer
});
routingModule.registerGuard("auth", {
  Component: AuthGate,
  props: { fallback: <Navigate to="/auth/login" /> },
  order: 20, // inner
});
```

**Escape hatch — manual wrap** (custom fallback, one-off shape, or consumer
predates the routing package's guard registry):

```tsx
// ✅ CORRECT — TenantGate outer, AuthGate inner
<TenantGate redirectTo={WORKSPACE_PICKER_PATH}>
  <AuthGate fallback={<Navigate to="/auth/login" />}>
    <AppShell />
  </AuthGate>
</TenantGate>

// ❌ WRONG — Auth first, then Tenant
<AuthGate fallback={<Navigate to="/auth/login" />}>
  <TenantGate redirectTo={WORKSPACE_PICKER_PATH}>
    <AppShell />
  </TenantGate>
</AuthGate>
```

**Why**: an authenticated user with no active workspace should land on the
picker — not on `/dashboard` and then bounce back to picker. Tenancy classifies
the CONTEXT (which host); auth classifies the SUBJECT (who's signed in). Context
first.

## Rule 4 — Auth-only apps mount routes WITHOUT `<TenantGate>`

Every consumer app that doesn't ship tenancy composes its routes without the
`<TenantGate>` wrapper. The workspace picker page still resolves (auth-ui
exports it) but the app's router simply doesn't mount that route.

Reference — a canonical tenancy-less router shape:

```tsx
// apps/single-tenant/src/router.tsx — no tenancy
export function buildRoutes(allRoutes) {
  return [
    defineRoute({
      path: "/",
      Component: () => (
        <AuthGate fallback={<Navigate to="/auth/login" />}>
          <AppShell />
        </AuthGate>
      ),
    }),
    // /auth/* — auth-ui's login, register, MFA, passkey forms all mount here.
    // NO /auth/workspaces route.
    ...authRoutes,
  ];
}
```

Reference — a canonical tenancy-enabled router shape (see the dashboard app):

```tsx
export function buildRoutes(allRoutes) {
  return [
    defineRoute({
      path: "/",
      Component: () => (
        <TenantGate redirectTo="/auth/workspaces">
          <AuthGate fallback={<Navigate to="/auth/login" />}>
            <AppShell />
          </AuthGate>
        </TenantGate>
      ),
    }),
    // /auth/workspaces — the picker page mounts because tenancy IS installed.
    // /auth/* — every other form.
    ...authRoutes,
  ];
}
```

## Rule 5 — Backend: `@stackra/auth` has no dependency on `@stackra/tenancy`

Same layering rule holds on the backend. The auth package's `package.json`
declares zero dep on tenancy. Tenancy CAN depend on auth (Layer 2 → Layer 1),
NEVER the reverse.

```jsonc
// backend/auth/package.json — CORRECT shape
{
  "dependencies": {
    "@stackra/identity": "workspace:^",
    // ... NO @stackra/tenancy anywhere
  },
}
```

Tenancy MAY declare `@stackra/auth` as an OPTIONAL peer when a specific action
(e.g. the `findTenants` magic-code dispatch) opts into auth-specific behaviour
with a fail-soft guard. See `backend/tenancy/package.json`'s
`peerDependenciesMeta` block.

## Rule 6 — Auth service uses `TenantContextInterface` from contracts, not tenancy

When the auth service needs to READ tenant context (e.g. to scope a PAT to a
specific tenant), it injects `TenantContextInterface` from `@stackra/contracts`.
Never `@stackra/tenancy`'s concrete `TenantContextResolver` directly.

The contracts-side interface is a fail-soft helper — when tenancy is absent, the
helper no-ops silently; the auth service sees `currentOrFail()` throw or
`current()` return `null`, and handles both gracefully.

```ts
// ✅ CORRECT
export class PatIssuer implements PatIssuerContract {
  constructor(
    @OptionalInject(TENANT_CONTEXT)
    private readonly tenantContext?: TenantContextInterface,
  ) {}

  async issue(identity: Identity, deviceName: string): Promise<IssuedPat> {
    const tenantId = this.tenantContext?.current()?.id;
    // ...
  }
}

// ❌ WRONG — hard dep on tenancy's concrete resolver
export class PatIssuer {
  constructor(private readonly resolver: TenantContextResolver) {}
}
```

## Rule 7 — `/auth/workspaces` route is tenancy-owned but auth-ui-composed

The workspace picker page (`<WorkspacePickerPage>`) lives IN `@stackra/auth-ui`
but consumes tenancy's `TENANCY_SERVICE`. The route `/auth/workspaces` is
CONTRIBUTED by auth-ui's route registration; it renders regardless of whether
tenancy is installed (rendering the `tenancy_unavailable` fallback state when
absent).

Rationale: the picker's chrome (header, footer, layout) is auth-ui's `AuthShell`
concern; the DATA (workspaces + switch action) is tenancy's concern. Splitting
along that seam keeps auth-ui's `AuthShell` the single source of truth for the
auth-landing visual language.

## Rule 8 — Frontend and backend URL alignment

> **ADR anchor.** The Slack-style URL shape below is codified by ADR-0091 —
> Slack-style workspace-first landing flow. The magic-login endpoints
> (`find-tenants` + `verify-magic-code`) land per that ADR; every other row in
> the table is Wave 2 alignment from ADR-0090. The optional `redirect_url` field
> every response DTO now carries is codified by ADR-0093 — OAuth redirect
> envelope on auth-action responses. The cross-app grant/exchange row's
> lifecycle (5-min TTL, single-use, hashed at rest) is codified by ADR-0094 —
> Cross-app SSO grant lifecycle. The four `/passkey/*` auth-scope routes are
> codified by ADR-0101 — Passkey URL semantics: primary-auth AND MFA-scope. The
> identity-scoped `/me/mfa/webauthn/*` routes (step-up + additional enrolment)
> stay per `@stackra/mfa`'s own routing contract, distinct from the four rows
> below. The enterprise-SSO rows (`/api/v1/auth/sso/*`, `/api/v1/scim/v2/*`,
> break-glass, and the public `/.well-known/saml/{tenant-slug}/metadata`
> discovery endpoint) are codified by ADR-0102 — Enterprise SSO architecture:
> SAML + OIDC + SCIM in-house.

Every frontend hook + service call MUST target a real backend route. The Wave 2
alignment (from the enterprise plan) locks these paths. Every handler lives in
the identity service:

| Frontend concern        | Backend URL                                         | Backend handler                            |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Login                   | `POST /api/v1/auth/login`                           | `identity · createLogin`                   |
| Logout                  | `POST /api/v1/auth/logout`                          | `identity · createLogout`                  |
| Register                | `POST /api/v1/auth/register`                        | `identity · createRegister`                |
| Forgot password         | `POST /api/v1/auth/password/forgot`                 | `identity · createForgot`                  |
| Reset password          | `POST /api/v1/auth/password/reset`                  | `identity · createReset`                   |
| Change password         | `POST /api/v1/auth/password/change`                 | `identity · createChange`                  |
| MFA verify              | `POST /api/v1/auth/mfa/verify`                      | `identity · createVerify`                  |
| Cross-app grant         | `POST /api/v1/auth/cross-app/grant`                 | `identity · createGrant`                   |
| Cross-app exchange      | `POST /api/v1/auth/cross-app/exchange`              | `identity · createExchange`                |
| Refresh                 | `POST /api/v1/auth/refresh`                         | `identity · createRefresh`                 |
| Email re-verify         | `POST /api/v1/auth/email/request-verification`      | `identity · createRequestVerification`     |
| Magic-login find        | `POST /api/v1/auth/find-tenants`                    | `identity · findTenants`                   |
| Magic-code verify       | `POST /api/v1/auth/verify-magic-code`               | `identity · createVerifyMagicCode`         |
| List my workspaces      | `GET /api/v1/me/tenants`                            | `identity · listMyTenants`                 |
| Show current tenant     | `GET /api/current-tenant`                           | `identity · showCurrentTenant`             |
| Workspace by slug       | `GET /api/v1/tenants/by-slug/{slug}`                | `identity · publicShowTenantBySlug`        |
| Passkey enroll options  | `POST /api/v1/auth/passkey/enroll/options`          | `identity · createPasskeyEnrollOptions`    |
| Passkey enroll          | `POST /api/v1/auth/passkey/enroll`                  | `identity · createPasskeyEnroll`           |
| Passkey login challenge | `POST /api/v1/auth/passkey/challenge`               | `identity · createPasskeyChallenge`        |
| Passkey login verify    | `POST /api/v1/auth/passkey/authenticate`            | `identity · createPasskeyAuthenticate`     |
| JWKS discovery          | `GET /.well-known/jwks.json`                        | `identity · listJwksJson`                  |
| Auth metadata           | `GET /.well-known/auth-metadata`                    | `identity · listAuthMetadata`              |
| SSO login init          | `POST /api/v1/auth/sso/init`                        | `identity · createSsoInit`                 |
| SSO login callback      | `POST /api/v1/auth/sso/callback`                    | `identity · createSsoCallback`             |
| SSO SP metadata         | `GET /.well-known/saml/{tenant-slug}/metadata`      | `identity · listSsoMetadata`               |
| SSO config CRUD         | `.../tenants/current/sso-configurations[/{id}]`     | `identity · {create,update,delete,list}SsoConfiguration` |
| SCIM Users              | `.../scim/v2/Users[/{id}]`                          | `identity · scimUser*` (4 verbs)           |
| SCIM Groups             | `.../scim/v2/Groups[/{id}]`                         | `identity · scimGroup*` (4 verbs)          |
| Break-glass provision   | `POST /api/v1/tenants/current/break-glass-accounts` | `identity · createBreakGlassAccount`       |
| Break-glass login       | `POST /api/v1/auth/break-glass-login`               | `identity · createBreakGlassLogin`         |

Every reviewer checks new URL work against this table. Adding a new endpoint
requires updating this table in the same commit.

## Anti-patterns

| Anti-pattern                                                                  | Correct                                                                                                                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/auth` package.json depends on `@stackra/tenancy`                    | Never. Tenancy is Layer 2, auth is Layer 1 (Rule 1).                                                                          |
| `@stackra/auth-ui` uses `useInject<TENANCY_SERVICE>` (non-optional)           | `useOptionalInject<TENANCY_SERVICE>` — tenancy is an optional peer (Rule 2).                                                  |
| `<AuthGate>` wraps `<TenantGate>` in router.tsx                               | Reverse — `<TenantGate>` outer, `<AuthGate>` inner (Rule 3).                                                                  |
| Auth-only app mounts `/auth/workspaces` route                                 | Skip the route entirely — the picker page lives in auth-ui but isn't mounted (Rule 4).                                        |
| `@stackra/auth` service injects `@stackra/tenancy`'s concrete resolver        | Inject `TenantContextInterface` from `@stackra/contracts` — fail-soft (Rule 6).                                              |
| Two duplicate backend handlers bound to the same URL (route collision)        | One handler per URL — reviewer rejects duplicate; the Aug-2026 tenancy dedupe wave removed 11 duplicates.                    |
| Frontend hook calls a URL not in Rule 8's table                               | Update either the FE URL to match the table OR add a new row in the same commit that introduces the new endpoint.             |
| Adding new tenancy → auth call site without a fail-soft binding guard         | Use a fail-soft container-binding guard so tenancy-only deploys (without auth) still boot cleanly. See `findTenants` shape.   |

## Enforcement

Zero-hit greps a reviewer runs before merging:

```sh
# Rule 1 — auth pkg has no tenancy peer (frontend + backend)
grep -E '"@stackra/tenancy"' \
  frontend/identity/src/auth/package.json
grep -E '"@stackra/tenancy"' \
  backend/auth/package.json

# Rule 2 — auth-ui's tenancy peer is OPTIONAL
grep -A5 '"@stackra/tenancy"' \
  frontend/identity/src/auth-ui/package.json | grep -q 'optional'

# Rule 3 — no AuthGate wrapping TenantGate
grep -rE 'AuthGate.*>\s*<TenantGate' \
  apps/*/src frontend/*/src

# Rule 6 — auth services don't import tenancy's concrete resolver
grep -rE "from ['\"]@stackra/tenancy" \
  backend/auth/src

# Rule 8 — every frontend HTTP call points at a table entry
# (manual reviewer check against the table)
```

## Cross-references

- ADR-0090 (draft) — this steering's authorising ADR.
- ADR-0091 (draft) — Slack-style workspace-first landing flow.
- ADR-0092 (draft) — Magic-code primary auth flow with password fallback.
- ADR-0093 (draft) — OAuth redirect envelope on auth-action responses.
- ADR-0094 (draft) — Cross-app SSO grant lifecycle.
- ADR-0095 (draft) — Duplicate-handler cleanup in `@stackra/tenancy`.
- ADR-0096 (draft) — Declarative route guards via `@stackra/routing` registry.
- [ADR-0101](../../.docs/adr/0101-passkey-url-semantics.md) — Passkey URL
  semantics: primary-auth AND MFA-scope (adds 4 new auth-scope rows to §Rule 8's
  URL table).
- [ADR-0102](../../.docs/adr/0102-enterprise-sso-architecture.md) — Enterprise
  SSO architecture: SAML + OIDC + SCIM in-house (adds 10 new enterprise rows to
  §Rule 8's URL table: SSO init/callback/metadata + 4 SSO config CRUD + SCIM
  Users + SCIM Groups + break-glass provision/login).
- `.kiro/plans/2026-08-13-auth-tenancy-enterprise-alignment.md` — the plan this
  codifies.
- `@stackra/contracts` — the fail-soft `TenantContextInterface` helper Rule 6
  injects.
- [`contract-implementer-split.md`](contract-implementer-split.md) — light-tier
  vs heavy-tier package pattern.
- [`subpath-layering.md`](subpath-layering.md) — frontend subpath layering
  (sibling rule).
- `backend/tenancy/src/actions/central/find-tenants.ts` — reference shape for
  fail-soft cross-package invocation.
- `backend/auth/src/actions/public/create-verify-magic-code.ts` — reference
  shape for the magic-code verify endpoint.
