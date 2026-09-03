# {{SLUG}} Worker

> **Brand:** {{BRAND}} · **Runtime:** Cloudflare Worker

## Quick start

```bash
pnpm install
pnpm dev          # local dev (wrangler dev)
pnpm test         # unit tests (vitest-pool-workers)
pnpm build        # dry-run deploy
```

## Health endpoint

- `GET /health` — returns `{ status: "alive" }`.

## Secrets

All secrets come from Doppler (`{{BRAND}}-{{SLUG}}` project) + Wrangler
secrets. See `.doppler.yaml` for the binding.
