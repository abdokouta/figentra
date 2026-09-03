# Architecture

`figentra-platform` is a **pure TypeScript** monorepo — pnpm workspaces
orchestrated by Turborepo. The backend runs on **Cloudflare Workers**, data
lives in **Supabase** (Postgres + Auth + Storage), and every cloud resource is
**Terraform-provisioned**. Go and Python are the only other languages permitted
for backend services; there is no PHP, Laravel, or Laravel Cloud anywhere in the
platform.

The layout:

```
apps/
  template/         — headless Worker API template
  api/              — main tenant API (Cloudflare Worker)
  ai-service/       — standalone AI service (TypeScript, or Python where the
                      model tooling demands it)
packages/           — shared TypeScript libraries (`@figentra/*`)
terraform/          — Cloudflare + Supabase infrastructure-as-code
scripts/            — bootstrap + migration helpers (Node ESM `*.mjs`)
```

## Non-negotiable conventions

- **`src/` as source root** across every app + package.
- **Headless only** — Workers expose token-only REST/RPC. No server-rendered
  sessions, no cookies-as-auth.
- **URL versioning** — `/api/v1/...`; cut a new route module for v2 rather than
  deprecating in place.
- **Bearer tokens / Supabase JWTs** — never server sessions.
- **Doppler for secrets** — no `.env` on disk anywhere. Every script wraps in
  `doppler run --`; Workers read secrets via Wrangler bindings sourced from
  Doppler.
- **Full docblocks + inline comments** on every new file the agent writes —
  carried across sessions as a standing instruction.

## Standard tools

| Concern            | Tool                               |
| ------------------ | ---------------------------------- |
| Formatting         | Prettier                           |
| Static analysis    | ESLint + `tsc --noEmit` (strict)   |
| Testing            | Vitest                             |
| Secrets            | Doppler                            |
| Task orchestration | Turborepo + pnpm                   |
| Backend runtime    | Cloudflare Workers (TypeScript)    |
| Data + auth        | Supabase (Postgres, Auth, Storage) |
| Provisioning       | Terraform (Cloudflare + Supabase)  |
| Deploy             | Wrangler                           |
| Error tracking     | Sentry                             |
| Git hooks          | Husky + commitlint + lint-staged   |
