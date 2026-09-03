# Worker — registry

**Status:** Normative component implementation specification.

## 1. Purpose

Application/resource/route/event/permission registry and generated platform
metadata.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an
ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `workers/registry`
- Package: `@figentra/application-registry`
- Version: `0.0.1`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test
tooling; peer dependencies are public host contracts only. Do not add
dependencies without a documented responsibility.

### Runtime

- `hono` `^4.13.5`
- `jose` `^6.0.0`
- `zod` `^4.0.0`
- `@figentra/observability` `0.2.0`
- `pino` `^10.0.0`
- `hono-pino` `0.10.3`

### Development

- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `oxlint` `^1.58.0`
- `prettier` `^3.9.6`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `wrangler` `^4.110.0`
- `vitest` `^4.1.2`
- `typescript` `^6.0.2`
- `@vitest/coverage-v8` `^4.1.2`

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

## 7. Worker standard

- Hono + Wrangler + Cloudflare Worker runtime.
- No Node-only runtime dependencies in Worker code.
- Cloudflare-native observability/tracing plus shared Worker adapter.
- Explicit route modules and route registry.
- Request/correlation/trace middleware.
- Secure CORS/security headers.
- Authentication/authorization fail closed.
- Service Bindings where appropriate; authenticated HTTPS for container
  services.
- Generated Wrangler bindings are part of the build contract.

## 8. Reliability/security

- Request size/time limits.
- Normalized upstream errors without leakage.
- Bounded retry only for safe/idempotent operations.
- Edge rate limiting.
- Webhook signature verification.
- Never execute arbitrary infrastructure operations from unauthenticated
  requests.

## 9. Testing

- Unit tests for middleware/routes/policies.
- Worker runtime integration tests.
- Upstream contract tests.
- Critical E2E tests.
- Load/failure tests for Gateway/Registry.

## 13. Infrastructure/configuration

- Environment names: `development`, `staging`, `production`.
- Non-secret deployment configuration belongs in `cloud.yaml`.
- Secrets are injected at runtime.
- Dockerfiles are production-oriented where applicable.
- Terraform owns infrastructure; generated catalogs/manifests are derived, not
  manually duplicated.

## 14. Current repository inventory

- `.doppler.yaml`
- `.gitignore`
- `.oxlintrc.json`
- `.prettierrc`
- `README.md`
- `__tests__/unit/index.test.ts`
- `__tests__/vitest.setup.ts`
- `cloud.yaml`
- `database/README.md`
- `database/migrations/0001_applications.sql`
- `database/migrations/0002_application_versions.sql`
- `database/migrations/0003_application_environments.sql`
- `database/migrations/0004_application_capabilities.sql`
- `database/migrations/0005_application_modules.sql`
- `database/migrations/0006_application_resources.sql`
- `database/migrations/0007_application_actions.sql`
- `database/migrations/0008_application_routes.sql`
- `database/migrations/0009_registrations.sql`
- `database/migrations/0010_audit_log.sql`
- `database/migrations/README.md`
- `database/rollbacks/0001_applications.sql`
- `database/rollbacks/0002_application_versions.sql`
- `database/rollbacks/0003_application_environments.sql`
- `database/rollbacks/0004_application_capabilities.sql`
- `database/rollbacks/0005_application_modules.sql`
- `database/rollbacks/0006_application_resources.sql`
- `database/rollbacks/0007_application_actions.sql`
- `database/rollbacks/0008_application_routes.sql`
- `database/rollbacks/0009_registrations.sql`
- `database/rollbacks/0010_audit_log.sql`
- `database/schema.sql`
- `package.json`
- `plan.md`
- `src/app.ts`
- `src/constants/registration-permission.constant.ts`
- `src/constants/registry-audience.constant.ts`
- `src/constants/registry-cache-ttl.constant.ts`
- `src/constants/route-cache-ttl.constant.ts`
- `src/constants/route-resolution-permission.constant.ts`
- `src/index.ts`
- `src/interfaces/registry-bindings.interface.ts`
- `src/interfaces/registry-claims.interface.ts`
- `src/interfaces/registry-variables.interface.ts`
- `src/middleware/authentication.middleware.ts`
- `src/middleware/request-context.middleware.ts`
- `src/routes/application.route.ts`
- `src/routes/health.route.ts`
- `src/routes/index.ts`
- `src/routes/metadata.route.ts`
- `src/routes/registration.route.ts`
- `src/routes/route-resolution.route.ts`
- `src/routes/version.route.ts`
- `src/schemas/application-manifest.schema.ts`
- `src/security/jwt-verifier.ts`
- `src/services/registry-cache.service.ts`
- `src/types/application-manifest.type.ts`
- `src/utils/sha256.util.ts`
- `src/validators/upstream.validator.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `worker-configuration.d.ts`
- `wrangler.jsonc`

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
