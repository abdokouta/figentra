# @figentra/notifications

Production NestJS service baseline for Figentra.

## Runtime

- Node.js 24+
- NestJS 12
- Fastify 5 adapter
- SWC compilation
- TypeScript type checking
- Vitest
- Oxlint
- Prettier
- nestjs-i18n
- Pino request logging

## Entrypoint

`src/main.ts` is the default HTTP executable entrypoint.

Add `main.worker.ts` or `main.cli.ts` only when a separately deployable process
is introduced. Do not create unused entrypoints.

## Documentation

Public classes, interfaces, functions, decorators, modules, DTOs, and exported
constants require TSDoc. Comments should document intent, invariants, security
boundaries, or non-obvious choices rather than narrate obvious code.
