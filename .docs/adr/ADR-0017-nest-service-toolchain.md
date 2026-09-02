# ADR-0017 — Standard NestJS Service Toolchain

**Status:** ACCEPTED

## Decision

All standard Figentra NestJS services use:

- Node 24 LTS
- ESM
- Nest CLI
- SWC for build
- TypeScript `noEmit` for type checking
- Vitest
- Oxlint
- Prettier
- `nestjs-i18n`
- `@nestjs/config`
- Terminus where health checks require dependency probes
- MikroORM only for services that own relational persistence

## Why SWC

Nest explicitly supports SWC as a builder and documents it as substantially faster than the default TypeScript compiler. SWC does not type-check, so Figentra runs a separate `tsc --noEmit` task. citeturn0search3

## Why not Webpack/Rspack

Nest's Rspack default is particularly useful for Nest CLI monorepo mode. Figentra uses a pnpm/Turbo monorepo of independently deployable standard Nest projects, so service builds should remain simple and individual-file oriented. Nest supports explicit builders and standard-mode builds without requiring the Nest CLI monorepo compiler. citeturn0search0turn0search2

## Why Oxlint

Oxlint is the repository lint standard. ESLint is not a baseline dependency.

## Why Vitest

Vitest is the repository test runner. Nest documents a Vitest + SWC configuration using `unplugin-swc`, which matches our ESM/decorator requirements. citeturn0search3

## Why separate `tsconfig.build.json`

The editor/test/type-check config and production build boundary have different inputs. Keeping both makes exclusions explicit and prevents tests from entering production output.

## Why one `main.ts`

An HTTP service has one runtime. Extra entrypoints are introduced only when a second runtime must be deployed/scaled independently.

## Observability

All NestJS services use the shared `@figentra/observability/nest` package. It
configures the official `@nestjs/observe` SDK and `@nestjs/devtools-integration`
without duplicating instrumentation code in individual services. Observe is
the primary Nest-native telemetry platform; Devtools HTTP introspection is
explicitly disabled in production. See ADR-0052.
