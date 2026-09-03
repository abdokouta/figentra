---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://link-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/link` — signed URLs + deep-link generation

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/link/` (`@stackra/nestjs-link` v0.1.0) **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/support` (Uri, Str),
`@stackra/encryption` (optional, for signed URLs) **Design effort:** 10 days
across 6 phases

## Purpose

URL generation for the workspace — named routes, signed URLs (HMAC), temporary
URLs (expiring), + deep-link handlers (mobile). One canonical way to build every
URL the app emits, matching Laravel's `route()` / `URL::signedRoute()` shape.

Solves the "which base URL do I concat to?" problem consistently across:

- Web (browser) — `useLink()` hook returns the right URL for the SPA / API.
- Nest server — controller emits URLs that the frontend consumes.
- Emails (via `@stackra/mail`) — signed URLs for password reset / magic links /
  unsubscribe.
- Deep links (RN mobile) — `stackra://user/42` → app resolves.

## Non-goals

- Route MATCHING — that's the framework's job (Nest / React Router / Expo
  Router). This package GENERATES URLs; matching is upstream.
- OAuth / IdP redirect flows — separate concern; consider `@stackra/auth` future
  package.
- URL shortening — separate concern.

## Public API — locked

### `LinkService`

```typescript
class LinkService {
  // Named-route generation
  to(
    routeName: string,
    params?: Record<string, unknown>,
    opts?: {
      absolute?: boolean; // default false — returns "/api/users/42"
      baseUrl?: string; // override the default base
      query?: Record<string, string>;
    },
  ): string;

  // Signed URLs — HMAC-SHA256 of path + params + expiry, appended as `?sig=...`
  signed(
    routeName: string,
    params: Record<string, unknown>,
    opts: {
      expiresIn?: number; // seconds; default undefined = no expiry
      scope?: string; // context binding — sig invalid outside scope
      absolute?: boolean;
    },
  ): string;

  // Temporary URLs — signed w/ mandatory expiry
  temporary(
    routeName: string,
    params: Record<string, unknown>,
    opts: {
      expiresIn: number; // required — seconds until expiry
      scope?: string;
      absolute?: boolean;
    },
  ): string;

  // Verification
  hasValidSignature(url: string, opts?: { scope?: string }): boolean;

  // Registration — services author route templates via forFeature
  registerRoute(
    name: string,
    template: string,
    opts?: {
      middleware?: string[]; // hint for docs / discovery
      scope?: string; // default scope for signed variants
    },
  ): void;
}
```

### Named-route registration

```typescript
@Module({
  imports: [
    LinkModule.forFeature([
      { name: "users.show",     template: "/api/v1/users/:id" },
      { name: "auth.verify",    template: "/verify/:token",     scope: "email" },
      { name: "unsubscribe",    template: "/unsub/:userId/:list", scope: "email" },
      { name: "web.dashboard",  template: "/dashboard" },
    ]),
  ],
})
```

Every registered route is discoverable via `LinkRegistry.all()`.

### `useLink()` React hook

```typescript
const link = useLink();
const url = link.to("users.show", { id: 42 });
const signedUrl = link.signed(
  "unsubscribe",
  { userId, list },
  { expiresIn: 86_400 },
);
```

### `useDeepLink()` RN hook

```typescript
const { register, resolve } = useDeepLink();

register("user.profile", "/user/:id", ({ params }) => {
  navigation.navigate("UserProfile", { id: params.id });
});
```

Compatible w/ Expo Router's `<Link>` component; extracts the route from the same
registry the web uses.

### `@stackra/link/nest` — controller decorator

```typescript
@Controller()
class UsersController {
  @Get("/api/v1/users/:id")
  @NamedRoute("users.show")  // ← binds this route to the name
  async show(@Param("id") id: string) { ... }
}
```

`NamedRouteScanner` auto-registers on module init — no manual `forFeature()`
list required.

## Signed-URL algorithm

```
sig = HMAC_SHA256(
  key = APP_KEY,
  message = `${method}\n${path}\n${sortedQueryString}\n${expiresAt ?? "0"}\n${scope ?? ""}`
)
```

- `APP_KEY` from `@stackra/config` (never inline).
- `expiresAt` embedded in query string as `?expires=<epoch>`.
- Verifier reads `expires` + reconstructs message + timing-safe compares
  signatures.
- Optional `scope` binds usage — a signed URL scoped `email` won't verify when
  hit from an in-app context (extra defense-in-depth).

## Subpath layout

```
packages/link/
├── package.json                          # 5 subpath exports
├── src/
│   ├── core/                             # ".": platform-agnostic
│   │   ├── link.module.ts
│   │   ├── services/
│   │   │   ├── link.service.ts
│   │   │   ├── signer.service.ts        # HMAC signing/verifying
│   │   │   └── template-resolver.service.ts
│   │   ├── registries/
│   │   │   └── link.registry.ts
│   │   ├── constants/
│   │   │   ├── signature-header.const.ts
│   │   │   └── default-scope.const.ts
│   │   ├── decorators/
│   │   │   └── named-route.decorator.ts
│   │   ├── errors/
│   │   │   ├── unknown-route.error.ts
│   │   │   ├── invalid-signature.error.ts
│   │   │   └── expired-signature.error.ts
│   │   ├── interfaces/
│   │   │   ├── route-metadata.interface.ts
│   │   │   ├── signature-options.interface.ts
│   │   │   └── link-options.interface.ts
│   │   ├── utils/
│   │   │   ├── expand-template.util.ts
│   │   │   ├── sort-query-string.util.ts
│   │   │   └── timing-safe-compare.util.ts
│   │   └── index.ts
│   ├── react/                            # "./react"
│   │   ├── contexts/
│   │   │   └── link.context.ts
│   │   ├── hooks/
│   │   │   ├── use-link.hook.ts
│   │   │   └── use-signed-link.hook.ts
│   │   ├── providers/
│   │   │   └── link.provider.tsx
│   │   ├── components/
│   │   │   └── link.component.tsx        # <Link to="users.show" params={{id: 42}} />
│   │   └── index.ts
│   ├── native/                           # "./native"
│   │   ├── hooks/
│   │   │   └── use-deep-link.hook.ts
│   │   ├── services/
│   │   │   └── deep-link-handler.service.ts
│   │   └── index.ts
│   ├── nest/                             # "./nest"
│   │   ├── nest-link.module.ts
│   │   ├── named-route.scanner.ts
│   │   ├── guards/
│   │   │   └── signature.guard.ts        # @UseGuards(SignatureGuard) verifies signed URLs
│   │   └── index.ts
│   └── testing/
│       ├── mock-link.ts
│       └── index.ts
└── __tests__/
    └── unit/                             # 15+ files
```

## Phases

### Phase 1 — Scaffold + registry (1 day)

- [ ] Package skeleton.
- [ ] `LinkRegistry` + `LinkModule.forFeature([...])`.

### Phase 2 — Template + query (2 days)

- [ ] Template expansion — `:param` + `{param}` syntax.
- [ ] Query-string serialisation w/ stable ordering.
- [ ] `to()` w/ absolute / relative modes.

### Phase 3 — Signing (2 days)

- [ ] `SignerService` — HMAC-SHA256 (via `@stackra/encryption` OR WebCrypto
      direct).
- [ ] `signed()` + `temporary()` variants.
- [ ] `hasValidSignature()` w/ timing-safe compare + scope check.
- [ ] Nest `SignatureGuard`.

### Phase 4 — React + RN bindings (2 days)

- [ ] `LinkProvider` + `useLink()` + `<Link>` component.
- [ ] `useDeepLink()` for RN.
- [ ] Deep-link resolver w/ Expo Router compat.

### Phase 5 — Nest scanner (1 day)

- [ ] `@NamedRoute` decorator.
- [ ] `NamedRouteScanner` at bootstrap.

### Phase 6 — Testing + docs (2 days)

- [ ] Unit tests (15+).
- [ ] Signed-URL security tests (invalid sig, expired, wrong scope, timing
      attack).
- [ ] README documents every generator + a signed-URL threat model.

## Exit criteria

- [ ] Named routes generate w/ absolute + relative modes.
- [ ] Signed URLs verify + reject tampered / expired / wrong-scope.
- [ ] Deep-link handlers register in RN + resolve on URL open.
- [ ] `@NamedRoute` auto-discovers on Nest bootstrap.
- [ ] 95% branch coverage.

## Cross-refs

- `@stackra/encryption` — optional peer for signing.
- `@stackra/mail` — signed URLs for password reset / magic links.
- `@stackra/config` — reads `APP_KEY` for signing secret.
- React Router / Expo Router — this package generates URLs; those match them.
