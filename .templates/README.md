# `.templates/` — project scaffolds

Canonical templates the `pnpm bootstrap:*` scripts copy into `services/`,
`workers/`, `packages/`, or `apps/` when creating a new deployable.

## Available templates

| Template | Location | Target | Runtime |
| -------- | -------- | ------ | ------- |
| **Service** | `.templates/service/` | `services/<name>/` | NestJS + Fastify on Cloudflare Container |
| **Worker** | `.templates/worker/` | `workers/<name>/` | Cloudflare Worker (Hono / raw fetch) |
| **Package** | `.templates/package/` | `packages/<name>/` | `@stackra/*` TS library (tsup dual-format) |
| **App (Vite)** | `.templates/app-vite/` | `apps/<name>/` | React + Vite on Cloudflare Pages |
| **App (Native)** | `.templates/app-native/` | `apps/<name>/` | Expo + React Native (Expo Router + EAS) |

## Placeholder tokens

Every template uses `{{MUSTACHE}}` placeholders that the bootstrap script
replaces at copy time:

| Token | Example value | Description |
| ----- | ------------- | ----------- |
| `{{PACKAGE_NAME}}` | `@figentra/orders-service` | Full npm-scoped package name |
| `{{SLUG}}` | `orders` | Kebab-case short name |
| `{{BRAND}}` | `figentra` | Owning brand slug |
| `{{PLANE}}` | `control` | Platform plane (product / control / client) |
| `{{PORT}}` | `3000` | HTTP listener port |
| `{{SOURCE_PATH}}` | `services/orders` | Monorepo-relative path |
| `{{DESCRIPTION}}` | `Order management service` | One-line description |
| `{{DISPLAY_NAME}}` | `Figentra Orders` | Human-readable display name |
| `{{SUBDOMAIN}}` | `orders` | Public hostname label |
| `{{WHEN_TO_USE}}` | `When building order workflows` | catalog.json guidance |
| `{{WHEN_NOT_TO_USE}}` | `For payment processing use @stackra/payments` | catalog.json guidance |

## How to bootstrap

```bash
# Service:
pnpm bootstrap:service --name orders --scope figentra --dest services/orders

# Worker:
pnpm bootstrap:worker --name registry --scope figentra --dest workers/registry

# Package:
pnpm bootstrap:package --name cache --scope stackra --dest packages/cache

# App (Vite):
pnpm bootstrap:app --name dashboard --scope academorix --dest apps/dashboard
```

Each script:
1. Copies the template folder to the destination.
2. Replaces all `{{PLACEHOLDER}}` tokens.
3. Writes a fresh `.doppler.yaml` binding.
4. Runs `pnpm install` in the new directory.

## Rules

- **Templates are NOT deployables** — they have no Doppler binding of their
  own (per `.kiro/steering/doppler.md`). The bootstrap script creates the
  binding at copy time.
- **Templates are committed** — they're source code, not generated output.
- **One template per kind** — never two service templates. Variations go
  into the bootstrap script's `--flags`.
- **Templates carry `{{PLACEHOLDER}}` tokens** — Prettier is configured to
  skip `.templates/` (in `.prettierignore`) so the tokens don't break
  formatting.

## Cross-references

- `.kiro/steering/doppler.md` §"Templates under `templates/` are NOT deployables".
- `.kiro/steering/package-conventions.md` — canonical package shape.
- `.kiro/steering/package-json-conventions.md` — per-tier `package.json` rules.
