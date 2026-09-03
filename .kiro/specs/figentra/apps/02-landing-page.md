# App — landing-page

**Status:** Normative component implementation specification.

## 1. Purpose

Public marketing/product landing application.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `apps/landing-page`
- Package: `@figentra/landing-page`
- Version: `0.0.0`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test
tooling; peer dependencies are public host contracts only. Do not add
dependencies without a documented responsibility.

### Runtime

- `@heroui/react` `^3.2.4`
- `@heroui/styles` `^3.2.4`
- `clsx` `2.1.1`
- `react` `^19.0.0`
- `react-dom` `^19.0.0`
- `react-router-dom` `^7.18.3`
- `@stackra/http` `^2.0.0`
- `@stackra/state` `^3.0.0`
- `@stackra/container` `2.0.0`
- `@stackra/logger` `2.0.0`

### Development

- `@tailwindcss/vite` `4.3.1`
- `@types/node` `^24.0.0`
- `@types/react` `^19.0.0`
- `@types/react-dom` `^19.0.0`
- `@vitejs/plugin-react` `6.0.2`
- `tailwind-variants` `3.3.0`
- `tailwindcss` `4.3.1`
- `typescript` `^6.0.2`
- `vite` `8.0.16`
- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `oxlint` `^1.58.0`
- `prettier` `^3.9.6`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `vitest` `^4.1.2`
- `@vitest/coverage-v8` `^4.1.2`
- `jsdom` `^26.1.0`
- `@playwright/test` `^1.62.1`

### Peer / optional peer

## 5. Source organization and documentation

- Use explicit `controllers`, `application`, `domain`, `infrastructure`,
  `repositories`, `entities`, `dto`, `interfaces`, `types`, `enums`,
  `constants`, `errors`, `events` and `__tests__` folders only where needed.
- Public interfaces/types/enums/constants use dedicated appropriately named
  files.
- No inline exported contracts in controllers/services.
- Add useful TSDoc/docblocks to every exported symbol, class, public method,
  adapter, repository method, endpoint and non-obvious configuration block.
- Comments explain invariants and architectural reasons, not syntax.

## 6. API contract

- Version routes (`/api/v1/...`).
- Keep controllers/route handlers thin.
- Document HTTP endpoints with OpenAPI/Swagger.
- Use the platform error envelope, pagination, filtering, sorting and
  idempotency conventions.
- Internal HTTP is authenticated S2S traffic; never trust arbitrary identity
  headers.

## 7. Package/application standard

- Explicit public exports and intentional subpaths.
- No accidental wildcard exposure of internals.
- Strict TypeScript from shared configuration.
- TSup where applicable.
- Oxlint + shared config.
- Prettier + shared config.
- Vitest + `__tests__`.
- Public API has TSDoc.

## 8. Frontend/mobile standard

- Vite apps: React 19, Tailwind 4, React Router 7, HeroUI 3.
- Application errors/performance through Sentry.
- `@stackra/logger` and `@stackra/container` for app context/logging.
- Playwright for critical browser flows.
- No private service credentials in bundles.
- API access goes through Gateway.

## 13. Infrastructure/configuration

- Environment names: `development`, `staging`, `production`.
- Non-secret deployment configuration belongs in `cloud.yaml`.
- Secrets are injected at runtime.
- Dockerfiles are production-oriented where applicable.
- Terraform owns infrastructure; generated catalogs/manifests are derived, not
  manually duplicated.

## 14. Current repository inventory

- `.gitignore`
- `.oxlintrc.json`
- `.prettierrc`
- `.vscode/settings.json`
- `LICENSE`
- `README.md`
- `__tests__/e2e/smoke.spec.ts`
- `__tests__/vitest.setup.ts`
- `cloud.yaml`
- `favicon.ico`
- `index.html`
- `package.json`
- `playwright.config.ts`
- `public/vite.svg`
- `src/App.tsx`
- `src/components/icons.tsx`
- `src/components/navbar.tsx`
- `src/components/primitives.ts`
- `src/components/theme-switch.tsx`
- `src/config/site.ts`
- `src/layouts/default.tsx`
- `src/main.tsx`
- `src/pages/about.tsx`
- `src/pages/blog.tsx`
- `src/pages/docs.tsx`
- `src/pages/index.tsx`
- `src/pages/pricing.tsx`
- `src/platform/stackra.ts`
- `src/styles/globals.css`
- `src/types/index.ts`
- `src/vite-env.d.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `vercel.json`
- `vite.config.ts`
- `vitest.config.ts`

## 15. Acceptance checklist

- [ ] Scaffold/runtime matches standard
- [ ] Dependencies justified and correctly classified
- [ ] Public exports complete
- [ ] Source boundaries complete
- [ ] Database/migrations/seeds complete where applicable
- [ ] OpenAPI/HTTP complete where applicable
- [ ] Events/outbox/messaging complete where applicable
- [ ] Authentication/authorization complete
- [ ] Health integrated
- [ ] Logging/telemetry/tracing integrated
- [ ] Cache strategy implemented where required
- [ ] Unit/integration/contract/E2E coverage complete
- [ ] Infrastructure/configuration complete
- [ ] Documentation/docblocks complete
- [ ] No TODO/FIXME/stub/shim/fake provider remains
