# NestJS Service Standard

Nest services use NestJS + Fastify + SWC + Pino + Vitest + Oxlint + Prettier.

Required bootstrap:

- `src/main.ts`
- `src/app.module.ts`

Do not generate placeholder AppController/AppService/DatabaseModule.

Use `i18n/`, `interfaces/`, `types/`, `enums/`, `constants/`, infrastructure and
bounded-context modules.

Use `__tests__` outside `src`.
