# Package — @stackra/state

**Status:** Normative component implementation specification.

## 1. Purpose

Platform component.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `packages`
- Package: `n/a`
- Version: `n/a`
- Type: `n/a`
- Node engine: `n/a`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test
tooling; peer dependencies are public host contracts only. Do not add
dependencies without a documented responsibility.

### Runtime

### Development

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

- `.DS_Store`
- `contracts/CHANGELOG.md`
- `contracts/README.md`
- `contracts/__tests__/vitest.setup.ts`
- `contracts/catalog.json`
- `contracts/package.json`
- `contracts/src/index.ts`
- `contracts/tsconfig.json`
- `contracts/tsup.config.ts`
- `contracts/vitest.config.ts`
- `events/CHANGELOG.md`
- `events/README.md`
- `events/__tests__/vitest.setup.ts`
- `events/catalog.json`
- `events/package.json`
- `events/src/constants/index.ts`
- `events/src/index.ts`
- `events/src/interfaces/index.ts`
- `events/src/schemas/audit-recorded-event.schema.ts`
- `events/src/schemas/index.ts`
- `events/src/testing/index.ts`
- `events/tsconfig.json`
- `events/tsup.config.ts`
- `events/vitest.config.ts`
- `iam/CHANGELOG.md`
- `iam/README.md`
- `iam/__tests__/vitest.setup.ts`
- `iam/catalog.json`
- `iam/package.json`
- `iam/src/index.ts`
- `iam/tsconfig.json`
- `iam/tsup.config.ts`
- `iam/vitest.config.ts`
- `identity/CHANGELOG.md`
- `identity/README.md`
- `identity/__tests__/vitest.setup.ts`
- `identity/catalog.json`
- `identity/package.json`
- `identity/src/index.ts`
- `identity/tsconfig.json`
- `identity/tsup.config.ts`
- `identity/vitest.config.ts`
- `messaging/CHANGELOG.md`
- `messaging/README.md`
- `messaging/__tests__/vitest.setup.ts`
- `messaging/catalog.json`
- `messaging/package.json`
- `messaging/src/constants/index.ts`
- `messaging/src/index.ts`
- `messaging/src/interfaces/index.ts`
- `messaging/src/nats-publisher.ts`
- `messaging/src/testing/index.ts`
- `messaging/tsconfig.json`
- `messaging/tsup.config.ts`
- `messaging/vitest.config.ts`
- `observability/README.md`
- `observability/__tests__/observability.test.ts`
- `observability/__tests__/vitest.setup.ts`
- `observability/package.json`
- `observability/src/contracts/index.ts`
- `observability/src/contracts/log-entry.interface.ts`
- `observability/src/contracts/service-identity.interface.ts`
- `observability/src/contracts/telemetry-context.interface.ts`
- `observability/src/core/context.ts`
- `observability/src/core/index.ts`
- `observability/src/core/redaction.ts`
- `observability/src/index.ts`
- `observability/src/nest/index.ts`
- `observability/src/testing/index.ts`
- `observability/src/worker/index.ts`
- `observability/tsconfig.json`
- `observability/tsup.config.ts`
- `observability/vitest.config.ts`
- `outbox/CHANGELOG.md`
- `outbox/README.md`
- `outbox/__tests__/integration/index.test.ts`
- `outbox/__tests__/vitest.setup.ts`
- `outbox/catalog.json`
- `outbox/package.json`
- `outbox/src/constants/index.ts`
- `outbox/src/index.ts`
- `outbox/src/interfaces/index.ts`
- `outbox/src/mikro-orm.ts`
- `outbox/src/relay.ts`
- `outbox/src/testing/index.ts`
- `outbox/src/types/index.ts`
- `outbox/tsconfig.json`
- `outbox/tsup.config.ts`
- `outbox/vitest.config.ts`
- `oxlint-config/.gitignore`
- `oxlint-config/.gitlab-ci.yml`
- `oxlint-config/README.md`
- `oxlint-config/base.jsonc`
- `oxlint-config/catalog.json`
- `oxlint-config/nest.jsonc`
- `oxlint-config/package.json`
- `oxlint-config/react.jsonc`
- `oxlint-config/worker.jsonc`
- `prettier-config/.gitignore`
- `prettier-config/.gitlab-ci.yml`
- `prettier-config/README.md`
- `prettier-config/catalog.json`
- `prettier-config/index.mjs`
- `prettier-config/package.json`
- `registry/CHANGELOG.md`
- `registry/README.md`
- `registry/__tests__/vitest.setup.ts`
- `registry/catalog.json`
- `registry/package.json`
- `registry/src/index.ts`
- `registry/tsconfig.json`
- `registry/tsup.config.ts`
- `registry/vitest.config.ts`
- `sdk/CHANGELOG.md`
- `sdk/README.md`
- `sdk/__tests__/unit/http-service-transport.test.ts`
- `sdk/__tests__/vitest.setup.ts`
- `sdk/catalog.json`
- `sdk/package.json`
- `sdk/src/approval/approval.client.ts`

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
