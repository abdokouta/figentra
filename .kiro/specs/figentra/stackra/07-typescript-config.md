# Package — @stackra/typescript-config

**Status:** Normative component implementation specification.

## 1. Purpose

Platform component.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `packages/typescript-config`
- Package: `@stackra/typescript-config`
- Version: `1.0.5`
- Type: `module`
- Node engine: `>=22.0.0`

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
- `.gitignore`
- `.gitlab-ci.yml`
- `.tmp/npmrc.backup`
- `README.md`
- `catalog.json`
- `package.json`
- `src/.DS_Store`
- `src/base.json`
- `src/native.json`
- `src/nest.json`
- `src/react-library.json`
- `src/vite-node.json`
- `src/vite.json`
- `src/worker.json`

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
