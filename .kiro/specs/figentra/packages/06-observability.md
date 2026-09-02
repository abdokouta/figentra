# Package — observability

**Status:** Normative component implementation specification.

## 1. Purpose

Cross-runtime operational signal contracts/adapters.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `packages/observability`
- Package: `@figentra/observability`
- Version: `0.2.0`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test tooling; peer dependencies are public host contracts only. Do not add dependencies without a documented responsibility.

### Runtime

- `@nestjs/devtools-integration` `12.0.0`
- `@nestjs/observe` `0.1.8`
- `@hono/structured-logger` `1.0.0`

### Development

- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `@stackra/tsup-config` `1.0.13`
- `@stackra/testing` `^1.0.2`
- `@types/node` `^24.0.0`
- `@vitest/coverage-v8` `^4.1.2`
- `oxlint` `^1.58.0`
- `pino` `^10.0.0`
- `prettier` `^3.9.6`
- `tsup` `^8.5.0`
- `typescript` `^6.0.2`
- `vitest` `^4.1.2`

### Peer / optional peer

- `@nestjs/common` `^12.0.0`
- `@nestjs/core` `^12.0.0`
- `hono` `^4.13.0`
- `rxjs` `^7.8.1`

## 5. Source organization and documentation

- Use explicit `controllers`, `application`, `domain`, `infrastructure`, `repositories`, `entities`, `dto`, `interfaces`, `types`, `enums`, `constants`, `errors`, `events` and `__tests__` folders only where needed.
- Public interfaces/types/enums/constants use dedicated appropriately named files.
- No inline exported contracts in controllers/services.
- Add useful TSDoc/docblocks to every exported symbol, class, public method, adapter, repository method, endpoint and non-obvious configuration block.
- Comments explain invariants and architectural reasons, not syntax.

## 6. API contract

- Version routes (`/api/v1/...`).
- Keep controllers/route handlers thin.
- Document HTTP endpoints with OpenAPI/Swagger.
- Use the platform error envelope, pagination, filtering, sorting and idempotency conventions.
- Internal HTTP is authenticated S2S traffic; never trust arbitrary identity headers.

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
- Terraform owns infrastructure; generated catalogs/manifests are derived, not manually duplicated.

## 14. Current repository inventory

- `README.md`
- `__tests__/observability.test.ts`
- `__tests__/vitest.setup.ts`
- `package.json`
- `src/contracts/index.ts`
- `src/contracts/log-entry.interface.ts`
- `src/contracts/service-identity.interface.ts`
- `src/contracts/telemetry-context.interface.ts`
- `src/core/context.ts`
- `src/core/index.ts`
- `src/core/redaction.ts`
- `src/index.ts`
- `src/nest/index.ts`
- `src/testing/index.ts`
- `src/worker/index.ts`
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
