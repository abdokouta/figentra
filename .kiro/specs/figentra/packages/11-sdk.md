# Package — sdk

**Status:** Normative component implementation specification.

## 1. Purpose

Reusable typed service/API clients; service clients belong here, not in Gateway.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `packages/sdk`
- Package: `@figentra/sdk`
- Version: `0.0.0`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test
tooling; peer dependencies are public host contracts only. Do not add
dependencies without a documented responsibility.

### Runtime

### Development

- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `oxlint` `^1.58.0`
- `prettier` `^3.9.6`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `typescript` `^6.0.2`
- `tsup` `^8.5.0`
- `vitest` `^4.1.2`
- `@vitest/coverage-v8` `^4.1.2`
- `@stackra/testing` `^1.0.2`
- `@stackra/tsup-config` `1.0.13`

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

## 13. Infrastructure/configuration

- Environment names: `development`, `staging`, `production`.
- Non-secret deployment configuration belongs in `cloud.yaml`.
- Secrets are injected at runtime.
- Dockerfiles are production-oriented where applicable.
- Terraform owns infrastructure; generated catalogs/manifests are derived, not
  manually duplicated.

## 14. Current repository inventory

- `CHANGELOG.md`
- `README.md`
- `__tests__/unit/http-service-transport.test.ts`
- `__tests__/vitest.setup.ts`
- `catalog.json`
- `package.json`
- `src/approval/approval.client.ts`
- `src/approval/index.ts`
- `src/audit/audit.client.ts`
- `src/audit/index.ts`
- `src/entitlements/entitlements.client.ts`
- `src/entitlements/index.ts`
- `src/iam/iam.client.ts`
- `src/iam/index.ts`
- `src/identity/identity.client.ts`
- `src/identity/index.ts`
- `src/index.ts`
- `src/monetization/index.ts`
- `src/monetization/monetization.client.ts`
- `src/notifications/index.ts`
- `src/notifications/notifications.client.ts`
- `src/policy/index.ts`
- `src/policy/policy.client.ts`
- `src/scope/index.ts`
- `src/scope/scope.client.ts`
- `src/tenant/index.ts`
- `src/tenant/tenant.client.ts`
- `src/transport/http-service-transport.ts`
- `src/transport/index.ts`
- `src/transport/service-transport.interface.ts`
- `src/usage/index.ts`
- `src/usage/usage.client.ts`
- `tsconfig.json`
- `tsup.config.ts`
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
