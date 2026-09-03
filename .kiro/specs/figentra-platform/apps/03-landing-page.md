# Landing Page Application — Kiro Implementation Specification

**Package:** `@figentra/landing-page`  
**Purpose:** Public marketing/site experience.

## Runtime and stack

React + Vite + static/edge deployment

## Boundary

The application owns UI composition, routes, pages, forms, local interaction
state and application-specific API consumption. It does not own platform
authorization, tenant authority, billing, or service databases.

## Runtime bootstrap

```text
Hostname
  → Gateway/runtime resolver
    → tenant + application + environment
      → manifest + branding + flags + capabilities
        → application shell
```

`GET /runtime` is metadata only and is never the final authorization authority.

## Frontend architecture

- TypeScript strict.
- React + Vite.
- React Router v7.
- HeroUI Pro + approved Stackra UI primitives.
- Stackra Query for server state.
- No Refine.
- No SDUI.
- Normal React components own page rendering.
- Application manifest describes resources/routes/permissions but does not
  serialize JSX/components.

## Resource pattern

```text
Module
  → Resource
    → Pages
    → Queries
    → Mutations
    → Actions
    → Permissions
    → Routes
    → API contracts
```

## Security

- Authenticate through the platform identity boundary.
- Never treat hidden navigation as authorization.
- Never accept tenant context solely from local storage/query params.
- Send only approved API requests through the gateway.

## Caching

Use Stackra Query for server-state caching. Do not introduce a second global
server-state cache. Respect API cache headers and invalidation events where
defined.

## i18n

Maintain locale resources per application. User-facing strings must use stable
translation keys. Support Arabic/English baseline and RTL behavior where
applicable.

## Testing

- component/unit tests;
- route tests;
- query/mutation tests;
- accessibility;
- localization/RTL;
- permission/feature visibility;
- E2E authenticated workflows;
- tenant isolation at API level.

## Documentation

Every application module/resource must document its business purpose, API
dependencies, permissions, routes, events consumed/emitted, configuration, and
operational assumptions.

## Acceptance

Builds independently, boots without Registry availability, resolves runtime
context safely, uses typed API contracts, passes accessibility/security/E2E
checks, and contains no business database credentials.

## Package manifest (repository baseline)

> This section is generated from the current repository `package.json`. The Kiro
> spec is the target contract; if implementation changes dependencies, update
> the spec and package manifest together.

### Runtime dependencies

- `@heroui/react`
- `@heroui/styles`
- `@stackra/container`
- `@stackra/http`
- `@stackra/logger`
- `@stackra/state`
- `clsx`
- `react`
- `react-dom`
- `react-router-dom`

### Development dependencies

- `@playwright/test`
- `@stackra/oxlint-config`
- `@stackra/prettier-config`
- `@stackra/typescript-config`
- `@tailwindcss/vite`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `@vitest/coverage-v8`
- `jsdom`
- `oxlint`
- `prettier`
- `prettier-plugin-tailwindcss`
- `tailwind-variants`
- `tailwindcss`
- `typescript`
- `vite`
- `vitest`

### Peer dependencies

- _None currently._

### Optional dependencies

- _None currently._
