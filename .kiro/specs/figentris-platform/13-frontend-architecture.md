# 13 — Frontend Architecture

**Status:** Baseline **Owner:** Frontend platform **Related:**
[02 Identity & actors](02-identity-and-actors.md),
[06 Application Registry](06-application-registry.md),
[09 Service communication](09-service-communication.md)

---

## 1. Purpose

Define the frontend stack, the portal, application frontends, authentication
integration, and the dynamic application launcher. This carries R-1: the
frontend is **Vite + React Router v7** — **not** Next.js by default, **no**
Refine, **no** server-driven UI (SDUI).

---

## 2. Canonical stack (R-1)

```text
React 19 + TypeScript
        ↓
Vite (build + dev/HMR)
        ↓
React Router v7        (routing; Data Mode default, Framework Mode where SSR/SSG needed)
        ↓
HeroUI Pro + design-system (@figentra/ui)     (components)
        ↓
Query/data layer (@figentra/query)            (server-state caching; TanStack Query under the hood)
        ↓
Figentra API (via @figentra/platform-sdk)
```

Plus: **Zod** for runtime validation, **Tailwind CSS** for styling.

The reference frontend note ("HeroUI Pro + Stackra UI → Stackra Query") maps to
`@figentra/ui` (design system, composing HeroUI Pro) and `@figentra/query` (data
layer). See **O-1**.

**Explicitly rejected** (R-1): Next.js as the default, Refine, and any SDUI /
duplicate query-HTTP abstraction.

---

## 3. Why Vite + React Router v7

- Fast dev / HMR; excellent AI-agent compatibility.
- Explicit, type-safe routing (route modules, type-safe hrefs).
- Lazy loading + code splitting.
- SPA-first, with SSR available later via **Framework Mode** — no framework
  lock-in.
- Straightforward Cloudflare deployment (Workers + Workers Assets).

Default the **portal** to React Router **Data Mode + SPA**. Adopt **Framework
Mode** only when an app needs SSR, SSG, route-module type safety at scale, or
framework-level code splitting. Do **not** adopt Next.js merely for popularity.

---

## 4. Routing model

Use **route modules**, not one giant manually-built route tree.

```text
app/
├── root.tsx
└── routes/
    ├── _layout.tsx
    ├── login.tsx
    ├── select-organization.tsx
    ├── dashboard.tsx
    ├── settings.tsx
    │   ├── organization.tsx
    │   ├── members.tsx
    │   ├── domains.tsx
    │   └── billing.tsx
    └── applications.$applicationKey.tsx
```

For application-driven navigation, either a platform route
`/applications/:applicationKey` or a platform-controlled redirect to the app's
host (`https://crm.figentra.com`). Dynamic routes are encouraged where they
represent real platform concepts (`/organizations/:organizationId`,
`/settings/:section`).

**Security:** the frontend must not generate arbitrary **executable** routes
from untrusted registry data, and must never execute JavaScript received from
the registry. The registry controls **metadata and routing**, not app UI
behavior ([06 §8]).

---

## 5. Authentication (Supabase Auth)

```text
React Router app
      ↓
Supabase Auth (session / active organization / org switching)
      ↓
Figentra APIs (via @figentra/platform-sdk, bearer Supabase Auth token)
```

- The frontend uses Supabase Auth as the identity provider and for org
  switching.
- The frontend may **hide** UI based on IAM state, but **UI checks are not
  security boundaries** — every protected operation is authorized server-side
  ([04](04-iam-and-authorization.md), [08](08-api-gateway.md)).
- Deep-link destinations are preserved across the auth redirect
  ([02 §7](02-identity-and-actors.md)).

---

## 6. Dynamic application launcher

The portal builds its application catalog from three platform inputs — never a
hard-coded app list:

```text
Application Registry ([06])     which apps exist + URLs + branding
        +
IAM ([04])                      which apps the actor can access
        +
Entitlements ([05])             which apps the tenant has purchased
        ↓
Application catalog → launcher (CRM Open · Commerce Open · POS No access · ...)
```

No application is hard-coded into the portal's authorization logic (Golden Rule
20). Adding an application makes it appear in the launcher automatically once
registered + entitled + granted.

---

## 7. Portal responsibilities

`app.figentra.com`:

- Show authenticated user + active organization; organization switching.
- Application launcher (dynamic, §6).
- Tenant administration: organization, members, applications, billing, domains,
  security, settings.
- Account/security + subscription/billing links (deep-link into the relevant
  service surfaces).

The portal does **not** become a generic runtime for arbitrary application pages
— application internal UI lives in the application ([§8]).

---

## 8. Application frontends

Each application ships its **own** independently deployable frontend:

```text
app.figentra.com        portal
crm.figentra.com        CRM frontend
commerce.figentra.com   Commerce frontend
pos.figentra.com        POS frontend
```

Suggested app frontend structure:

```text
src/
├── routes/        route modules
├── features/      feature modules
├── components/    UI
├── layouts/
├── lib/           platform SDK wiring, clients
├── services/
├── hooks/
├── schemas/       Zod schemas
├── types/
└── styles/
```

Do not put business logic inside route components. Application-specific routes
stay inside the application (`crm.figentra.com/customers/:customerId`).

---

## 9. Shared frontend packages

```text
@figentra/ui           design system (composes HeroUI Pro + Tailwind)
@figentra/auth         Supabase Auth integration + resolve helpers ([09])
@figentra/query        server-state/data layer (TanStack Query under the hood)
@figentra/contracts    API types (shared with backend — [12])
@figentra/client       generated/typed API client
@figentra/router       shared routing helpers
```

---

## 10. Micro-frontend decision

Do **not** start with a module-federation micro-frontend framework. Use
**independently deployed applications** + shared packages (§9). Consider Module
Federation only when independent teams need runtime UI composition and there is
a demonstrated business requirement.

---

## 11. Frontend deployment

```text
Vite build → static assets → Cloudflare (Workers + Workers Assets / CDN)
```

- Pure SPA: build static assets, serve via Cloudflare.
- SSR apps: React Router Framework Mode + the Cloudflare-supported deployment.

Detail in [15](15-infrastructure-and-iac.md) /
[19](19-environments-and-cicd.md).

---

## 12. Non-goals / anti-patterns

| Anti-pattern                                                    | Correct                                              |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| Next.js as the default frontend                                 | Vite + React Router v7 (R-1).                        |
| Refine / SDUI / a duplicate query-HTTP abstraction              | HeroUI Pro + `@figentra/ui` + `@figentra/query`.     |
| One giant route tree built by hand                              | Route modules.                                       |
| Executing code / generating executable routes from the registry | Metadata + routing only; never eval registry data.   |
| Hard-coding the app list in the portal                          | Dynamic launcher from Registry + IAM + Entitlements. |
| Business logic in route components                              | Logic in features/services; routes are thin.         |
| Treating UI permission hiding as security                       | Server-side authorization is the boundary.           |
| Module federation from day one                                  | Independent app deploys + shared packages.           |

---

## 13. Open questions

- **O-1** — Confirm whether the design-system/query packages are literally
  `@stackra/*` (as the reference note implied) or `@figentra/*`. Specs assume
  `@figentra/ui` + `@figentra/query`; a decision here updates §2/§9 and the
  README naming note.
