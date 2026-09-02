# NestJS Service Standard

**Status: APPROVED**

Every substantial Figentra Node service follows this baseline:

```text
NestJS 12
Node.js 24+
Fastify 5
SWC
TypeScript
Vitest
Oxlint
Prettier
nestjs-i18n
nestjs-pino
```

## Required files

```text
Dockerfile
nest-cli.json
.swcrc
.oxlintrc.json
.prettierrc
tsconfig.json
tsconfig.build.json
vitest.config.ts
vitest.config.e2e.ts
package.json
README.md
src/main.ts
src/app.module.ts
src/i18n/
```

## Compilation

SWC compiles production code. TypeScript performs type checking separately.

```text
nest build → SWC
pnpm run typecheck → tsc --noEmit
```

## HTTP

Use `FastifyAdapter`.

## Entrypoints

Use one `src/main.ts` HTTP entrypoint by default.

Add `main.worker.ts` or `main.cli.ts` only when the process is separately
deployable.

## i18n

Use `nestjs-i18n` with JSON resources under:

```text
src/i18n/
├── en/
└── ar/
```

Configure the Nest compiler to copy `i18n/**/*` to `dist`.

## Root module

`AppModule` is a composition root only. It imports infrastructure and bounded
contexts; it does not contain domain logic.

## Generated boilerplate

Remove:

- `AppController`
- `AppService`
- generic `DatabaseModule`

Create database infrastructure only when the service owns persistence.

## Linting

Oxlint is the only default linter. ESLint is not included.

## Testing

Vitest is the standard unit/integration test runner.

## Documentation

All public symbols require TSDoc. Entrypoints and configuration files require
short intent comments.
