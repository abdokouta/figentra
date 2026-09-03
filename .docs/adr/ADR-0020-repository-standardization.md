# ADR-0020 — Repository-Wide Engineering Standardization

## Status

Accepted.

## Context

Figentra contains reusable Stackra packages, NestJS services, Cloudflare
Workers, Vite applications, and Terraform/Docker infrastructure. Independent
scaffolding would otherwise create incompatible TypeScript, testing, linting,
packaging, deployment, and documentation conventions.

## Decisions

1. Canonical environments are `development`, `staging`, and `production`. `dev`,
   `stg`, and `prd` are CLI aliases only.
2. Publishable Stackra packages own `catalog.json`. Deployable applications,
   Workers, and services own `cloud.yaml`.
3. Packages use `@stackra/typescript-config`, `@stackra/tsup-config`, and
   `@stackra/testing` where applicable.
4. Vitest is the standard test runner. Tests live under `__tests__`.
5. Oxlint is the standard linter. ESLint is not a platform default.
6. Prettier is the standard formatter.
7. Public interfaces, types, enums, and constants use dedicated files with
   `.interface.ts`, `.type.ts`, `.enum.ts`, and `.constant.ts` suffixes.
8. Important source/configuration files contain useful documentation and
   comments focused on intent, ownership, security, and invariants.
9. NestJS services use Fastify and SWC.
10. Cloudflare Workers use Hono/Wrangler and generated binding types.
11. Terraform remains the infrastructure source of truth; generated Docker
    Compose/Wrangler artifacts must not become competing sources of truth.
12. Test setup is standardized through `__tests__/vitest.setup.ts`.
13. SDUI is not a default application architecture.

## Consequences

The repository becomes more predictable for developers, CI, static tooling, AI
agents, and deployment automation. More files are created for declarations, but
discovery, ownership, code review, and generated-contract validation become
substantially clearer.
