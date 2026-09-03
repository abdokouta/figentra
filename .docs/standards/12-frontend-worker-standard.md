# Frontend and Worker Standard

## Frontend

`apps/portal` and `apps/landing-page` use:

- Vite
- React 19
- HeroUI V3
- Tailwind CSS v4
- React Router 7
- TensorStack Query
- TensorStack State
- TensorStack HTTP
- Oxlint
- Prettier
- Vitest where application tests require it

HeroUI V3 does not require `HeroUIProvider`; styles are imported through
`@heroui/styles`. citeturn4search2turn0search1

## Workers

`services/gateway` and `workers/registry` use:

- Cloudflare Workers
- Hono
- Wrangler
- TypeScript
- Oxlint
- Prettier
- Vitest

## Documentation

Public components, hooks, route factories, Worker handlers and exported
utilities require TSDoc. File headers are required for infrastructure and
entrypoint files.

## Linting

Oxlint is the repository linter. Do not add ESLint to deployable applications or
Workers.
