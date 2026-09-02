# Worker — infrastructure-orchestrator

**Status:** Normative component implementation specification.

## 1. Purpose

Controlled Terraform orchestration boundary; never arbitrary unauthenticated execution.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `workers/infrastructure-orchestrator`
- Package: `@figentra/infrastructure-orchestrator`
- Version: `0.0.1`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test tooling; peer dependencies are public host contracts only. Do not add dependencies without a documented responsibility.

### Runtime

- `@cloudflare/containers` `^0.3.7`
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
- `wrangler` `^4.110.0`
- `vitest` `^4.1.2`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `typescript` `^6.0.2`
- `@vitest/coverage-v8` `^4.1.2`

### Peer / optional peer


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

## 7. Worker standard

- Hono + Wrangler + Cloudflare Worker runtime.
- No Node-only runtime dependencies in Worker code.
- Cloudflare-native observability/tracing plus shared Worker adapter.
- Explicit route modules and route registry.
- Request/correlation/trace middleware.
- Secure CORS/security headers.
- Authentication/authorization fail closed.
- Service Bindings where appropriate; authenticated HTTPS for container services.
- Generated Wrangler bindings are part of the build contract.

## 8. Reliability/security

- Request size/time limits.
- Normalized upstream errors without leakage.
- Bounded retry only for safe/idempotent operations.
- Edge rate limiting.
- Webhook signature verification.
- Never execute arbitrary infrastructure operations from unauthenticated requests.

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
- Terraform owns infrastructure; generated catalogs/manifests are derived, not manually duplicated.

## 14. Current repository inventory

- `.doppler.yaml`
- `.gitignore`
- `.oxlintrc.json`
- `.prettierrc`
- `README.md`
- `__tests__/vitest.setup.ts`
- `cloud.yaml`
- `database/migrations/0001_infrastructure_jobs.sql`
- `database/migrations/README.md`
- `database/rollbacks/0001_infrastructure_jobs.sql`
- `package.json`
- `plan.md`
- `runner/Dockerfile`
- `runner/entrypoint.sh`
- `src/app.ts`
- `src/constants/orchestrator-audience.constant.ts`
- `src/index.ts`
- `src/interfaces/infrastructure-principal.interface.ts`
- `src/interfaces/orchestrator-bindings.interface.ts`
- `src/interfaces/orchestrator-variables.interface.ts`
- `src/interfaces/terraform-workflow-input.interface.ts`
- `src/middleware/authentication.middleware.ts`
- `src/middleware/request-context.middleware.ts`
- `src/routes/health.route.ts`
- `src/routes/index.ts`
- `src/routes/jobs.route.ts`
- `src/schemas/terraform-job.schema.ts`
- `src/services/auth.service.ts`
- `src/services/job.service.ts`
- `src/services/runner.service.ts`
- `src/terraform-runner.ts`
- `src/types/terraform-operation.type.ts`
- `src/workflows/infrastructure.workflow.ts`
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
