---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://swagger-plan
reviewed_by: null
reviewed_at: null
---

# `@stackra/swagger` — OpenAPI documentation for Nest services

**Status:** Planned **Anchor ADRs:**
[ADR-0091](../../.docs/adr/ADR-0091-cross-runtime-package-structure.md),
[ADR-0092](../../.docs/adr/ADR-0092-service-auto-registration.md) **Reference:**
`.ref/packages/swagger/` (`@stackra/nestjs-swagger` v0.1.0) **Depends on:**
`@stackra/container`, `@stackra/contracts`, `@stackra/response` (envelope
integration), `@nestjs/swagger` (required peer), `swagger-themes` (optional
peer) **Design effort:** 10 days across 6 phases

## Purpose

Production-ready OpenAPI documentation for every Nest service. Handles:

- **Auto-discovery** of controllers + DTOs.
- **Auth schemes** — Bearer / OAuth2 / API Key / Basic — all pre-configured.
- **Response envelope** — every 2xx wraps the payload in the `@stackra/response`
  envelope automatically (no manual `@ApiResponse` per endpoint).
- **Theming + branding** — dark mode, workspace logo, custom favicon, per-env
  color scheme via `swagger-themes`.
- **Path filtering** — `?tags=admin` hides everything not tagged.
- **Multiple docs surfaces** — `/api/docs` (public), `/api/docs/internal`
  (auth-gated), `/api/docs/admin` (super-admin gated).
- **Static export** — `stackra swagger:export` (via `@stackra/console`) dumps
  `openapi.yaml` / `openapi.json` for consumer SDK generation.

## Non-goals

- OpenAPI 2.0 (Swagger 2) — we're 3.1+ only.
- SDK code generation — that's downstream (openapi-generator / orval).
- Client-side rendering — the docs page is server-rendered via `swagger-ui`
  standalone.

## Public API — locked

### `SwaggerModule`

```typescript
SwaggerModule.forRoot({
  title: "Approval Service",
  version: "1.0.0",
  description: "Approval workflow API",
  contact: { name: "Platform Team", email: "platform@stackra.com" },
  license: { name: "MIT" },

  docs: [
    {
      path: "/api/docs", // ← multi-surface
      audience: "public", // filters controllers by @ApiAudience
    },
    {
      path: "/api/docs/internal",
      audience: "internal",
      auth: { scheme: "bearer" }, // gate w/ guard
    },
  ],

  auth: {
    bearer: { name: "JWT", description: "Bearer <token>" },
    apiKey: { name: "X-API-Key", in: "header" },
  },

  theme: {
    dark: true,
    logo: "/static/logo.png",
    favicon: "/static/favicon.ico",
    accentColor: "#0EA5E9",
  },

  envelope: {
    // Auto-wrap 2xx responses in @stackra/response envelope shape.
    autoWrap: true,
    successExample: { data: {}, meta: { request_id: "req_..." } },
    errorExample: { error: { code: "...", message: "..." } },
  },

  export: {
    outputPath: "./openapi/openapi.yaml",
    format: "yaml",
  },
});
```

### `@ApiAudience(audience)` decorator

Filters controllers into multi-surface docs:

```typescript
@Controller("/api/users")
@ApiAudience(["public", "internal"])   // shown in both /api/docs and /api/docs/internal
class UsersController { ... }

@Controller("/api/admin/users")
@ApiAudience(["internal"])              // only in /api/docs/internal
class AdminUsersController { ... }
```

### `@ApiEnvelopeResponse()` decorator

Explicit envelope-shaped response — auto-applied for controllers that don't
declare it explicitly (when `envelope.autoWrap: true`):

```typescript
@Get("/users/:id")
@ApiEnvelopeResponse({ dataType: UserDto })
async show(@Param("id") id: string) { ... }
```

Renders as:

```yaml
responses:
  200:
    schema:
      properties:
        data:
          $ref: "#/components/schemas/UserDto"
        meta:
          $ref: "#/components/schemas/ResponseMeta"
```

### `stackra swagger:export` command

Ships as a `@stackra/console` command inside this package:

```
$ stackra swagger:export --service approval --output ./openapi/
```

Generates the `openapi.yaml` at build time, so the CI can consume it +
distribute to SDK repos.

## Subpath layout

```
packages/swagger/
├── package.json                          # 3 subpath exports
├── src/
│   ├── nest/                             # ".": Nest module (default entry)
│   │   ├── swagger.module.ts
│   │   ├── services/
│   │   │   ├── document-builder.service.ts
│   │   │   ├── envelope-wrapper.service.ts
│   │   │   └── theme.service.ts
│   │   ├── decorators/
│   │   │   ├── api-audience.decorator.ts
│   │   │   ├── api-envelope-response.decorator.ts
│   │   │   └── api-paginated-response.decorator.ts
│   │   ├── constants/
│   │   │   ├── default-auth-schemes.const.ts
│   │   │   ├── default-theme.const.ts
│   │   │   └── envelope-schema.const.ts
│   │   ├── interfaces/
│   │   │   ├── swagger-options.interface.ts
│   │   │   ├── docs-surface.interface.ts
│   │   │   └── theme-options.interface.ts
│   │   ├── middleware/
│   │   │   └── docs-auth.middleware.ts   # audience-gated docs surfaces
│   │   ├── utils/
│   │   │   ├── register-audience.util.ts
│   │   │   ├── inject-envelope-schema.util.ts
│   │   │   └── build-theme-css.util.ts
│   │   └── index.ts
│   ├── cli/                              # "./cli"
│   │   ├── swagger-export.command.ts
│   │   └── index.ts
│   └── testing/
│       ├── mock-swagger-document.ts
│       └── index.ts
└── __tests__/
    └── unit/                             # 12+ files
```

## Auth-scheme presets

```typescript
DEFAULT_AUTH_SCHEMES = {
  bearer: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
  apiKey: {
    type: "apiKey",
    in: "header",
    name: "X-API-Key",
  },
  oauth2: {
    type: "oauth2",
    flows: {
      authorizationCode: {
        authorizationUrl: "https://auth.example.com/authorize",
        tokenUrl: "https://auth.example.com/token",
        scopes: {},
      },
    },
  },
};
```

Consumers override individual scheme fields; the module deep-merges.

## Envelope integration

When `envelope.autoWrap: true`, the module runs after Nest's Swagger scanner

- mutates every `2xx` response schema:

```typescript
// Before
{ 200: { schema: { $ref: "#/UserDto" } } }

// After
{ 200: { schema: {
    properties: {
      data: { $ref: "#/UserDto" },
      meta: { $ref: "#/ResponseMeta" }
    }
} } }
```

Controllers that use `@ApiPaginatedResponse()` render as the
`@stackra/pagination` envelope shape (`data: []`, `meta`, `links`).

## Theming

`swagger-themes` (optional peer) provides base themes; `theme.service.ts`
composes them w/ workspace overrides:

- Dark mode default.
- Workspace logo top-left.
- Custom accent color (via CSS var injection).
- Sticky auth panel (unlike default `swagger-ui`).

## Phases

### Phase 1 — Scaffold (1 day)

- [ ] Package skeleton.
- [ ] `SwaggerModule.forRoot()` w/ single-surface default.

### Phase 2 — Multi-surface docs (2 days)

- [ ] `@ApiAudience()` decorator.
- [ ] Multi-mount at `docs[].path` w/ per-mount filtering.
- [ ] `docs-auth.middleware` gates internal surfaces.

### Phase 3 — Envelope integration (2 days)

- [ ] `EnvelopeWrapperService` post-processes `SwaggerModule.createDocument()`.
- [ ] Injects `ResponseMeta`, `ErrorEnvelope` schemas as components.
- [ ] `@ApiEnvelopeResponse` + `@ApiPaginatedResponse` decorators.

### Phase 4 — Theming + branding (2 days)

- [ ] `ThemeService` w/ dark + light presets.
- [ ] Custom CSS injection for logo + accent color.
- [ ] Sticky auth panel patch.

### Phase 5 — Export command (1 day)

- [ ] `stackra swagger:export` command via `@stackra/console`.
- [ ] YAML + JSON output.
- [ ] `--service` filter for multi-service repos.

### Phase 6 — Testing + docs (2 days)

- [ ] Unit tests (12+).
- [ ] Integration test — boot service + hit `/api/docs` + assert HTML + schema
      shape.
- [ ] README documents every option + shows a screenshot of the themed UI.

## Exit criteria

- [ ] Multi-surface docs render at `/api/docs` + `/api/docs/internal`.
- [ ] Envelope wrapping applied to every 2xx response schema.
- [ ] Dark-mode theme applies w/ workspace logo + accent color.
- [ ] Auth-gated surfaces reject unauth'd users.
- [ ] `stackra swagger:export` produces valid OpenAPI 3.1 YAML.
- [ ] 90% branch coverage.

## Cross-refs

- `@stackra/response` — envelope shape source.
- `@stackra/pagination` — pagination envelope schema.
- `@stackra/console` — export command host.
- `@nestjs/swagger` — required peer.
