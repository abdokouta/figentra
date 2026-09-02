# Service — entitlements

**Status:** Normative component implementation specification.

## 1. Purpose

Commercial capability grants derived from monetization state.

## 2. Boundary and ownership

Own only the responsibilities defined here. Cross-boundary changes require an ADR. Never write another service database directly.

## 3. Repository/runtime identity

- Path: `services/entitlements`
- Package: `@figentra/entitlements`
- Version: `0.0.1`
- Type: `module`
- Node engine: `>=24.0.0`

## 4. Dependencies

Runtime dependencies are production code; dev dependencies are build/test tooling; peer dependencies are public host contracts only. Do not add dependencies without a documented responsibility.

### Runtime

- `@nestjs/common` `^12.0.1`
- `@nestjs/core` `^12.0.1`
- `@nestjs/config` `^4.0.0`
- `@nestjs/terminus` `^11.0.0`
- `class-transformer` `^0.5.1`
- `class-validator` `^0.14.1`
- `nestjs-i18n` `^10.5.0`
- `reflect-metadata` `^0.2.2`
- `rxjs` `^7.8.1`
- `@nestjs/platform-fastify` `^12.0.1`
- `fastify` `^5.12.1`
- `nestjs-pino` `^5.0.0`
- `pino-http` `^11.0.0`
- `@nestjs/microservices` `^12.0.1`
- `@nats-io/transport-node` `^3.0.0`
- `@figentra/contracts` `0.1.0`
- `@figentra/events` `0.1.0`
- `@figentra/messaging` `0.1.0`
- `@figentra/security` `0.1.0`
- `@figentra/observability` `0.2.0`
- `pino` `^10.0.0`

### Development

- `@nestjs/cli` `^12.0.0`
- `@nestjs/schematics` `^12.0.0`
- `@nestjs/testing` `^12.0.1`
- `@stackra/oxlint-config` `1.0.0`
- `@stackra/prettier-config` `1.0.2`
- `@stackra/typescript-config` `1.0.5`
- `@swc/cli` `^0.7.0`
- `@swc/core` `^1.13.0`
- `@types/node` `^24.0.0`
- `@types/supertest` `^7.0.0`
- `@vitest/coverage-v8` `^4.1.2`
- `oxlint` `^1.58.0`
- `prettier` `^3.9.6`
- `prettier-plugin-tailwindcss` `^0.6.14`
- `source-map-support` `^0.5.21`
- `supertest` `^7.0.0`
- `typescript` `^6.0.2`
- `unplugin-swc` `^1.5.7`
- `vite-tsconfig-paths` `^5.1.4`
- `vitest` `^4.1.2`

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

## 7. NestJS standard

- NestJS + Fastify adapter.
- Nest dependency injection.
- `@figentra/health` + `@nestjs/terminus`.
- Pino/nestjs-pino structured logging.
- Nest Observe for Nest-native telemetry.
- `nestjs-i18n` for localized/user-facing messages where applicable.
- NATS/JetStream is the durable async transport; `@nestjs/microservices` is not the default S2S transport.

## 8. MikroORM/data standard

- Service owns its PostgreSQL boundary.
- Prefer `@InjectRepository(Entity)` / `EntityRepository<Entity>` for normal persistence.
- Use `EntityManager` for explicit transactions, multi-repository units of work, native SQL, and atomic domain+outbox commits.
- Never expose EntityManager to controllers.
- One coherent migration per schema change; explicit keys, foreign keys, unique constraints and indexes.
- Deterministic seeders.
- Cache at service/query/repository boundary for read optimization; Gateway cache only safe representations and never as an authorization source.

## 9. Messaging/events

- Domain state changes crossing service boundaries use transactional outbox.
- Relay publishes to NATS JetStream.
- Consumers are idempotent.
- Commands request work; events state facts; queries read state.
- Event envelope carries event ID/type/version, producer, time, tenant/actor context and correlation/trace metadata.
- Retry with bounded backoff; terminal failure goes to DLQ.

## 10. Security

- Validate JWT issuer/audience/signature/expiry.
- Authorize through IAM/policy/scope.
- Enforce tenant isolation server-side.
- Never trust client-supplied principal/tenant headers.
- Secrets are runtime injected and never logged.

## 11. Health/observability

- `/health/live`, `/health/ready`, `/health` through shared health package.
- Indicators are service-owned and bounded.
- Propagate request ID, correlation ID and W3C trace context.
- Structured Pino logs with service/version/environment.
- Redact credentials/tokens/sensitive payloads.

## 12. Testing

- Unit tests for every use case/invariant.
- Persistence/migration integration tests.
- NATS/outbox integration tests where applicable.
- Contract tests.
- Authenticated authorization E2E.
- Retry/idempotency/failure tests.
- Tests live under `__tests__/unit`, `__tests__/integration`, `__tests__/contract`, `__tests__/e2e`.

## 13. Infrastructure/configuration

- Environment names: `development`, `staging`, `production`.
- Non-secret deployment configuration belongs in `cloud.yaml`.
- Secrets are injected at runtime.
- Dockerfiles are production-oriented where applicable.
- Terraform owns infrastructure; generated catalogs/manifests are derived, not manually duplicated.

## 14. Current repository inventory

- `.oxlintrc.json`
- `.prettierrc`
- `.swcrc`
- `Dockerfile`
- `README.md`
- `__tests__/e2e/health.e2e.test.ts`
- `__tests__/vitest.setup.ts`
- `cloud.yaml`
- `nest-cli.json`
- `package.json`
- `src/app.module.ts`
- `src/i18n/ar/common.json`
- `src/i18n/ar/validation.json`
- `src/i18n/en/common.json`
- `src/i18n/en/validation.json`
- `src/infrastructure/health.controller.ts`
- `src/infrastructure/observability.ts`
- `src/main.ts`
- `tsconfig.build.json`
- `tsconfig.json`
- `vitest.config.base.ts`
- `vitest.config.e2e.ts`
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
