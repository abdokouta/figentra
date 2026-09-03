# {{SLUG}} service

> **Brand:** {{BRAND}} · **Runtime:** NestJS + Fastify on Cloudflare Container

## Quick start

```bash
pnpm install
pnpm dev          # watch mode
pnpm test         # unit tests
pnpm test:e2e     # integration tests
pnpm build        # production build
```

## Infrastructure modules

This service declares its infrastructure capabilities in `cloud.yaml`'s
`modules: []` array. Add modules as needed — see
`infrastructure/modules/README.md` for the full catalog.

## Health endpoints

- `GET /health/live` — liveness probe (always 200 if process is running).
- `GET /health/ready` — readiness probe (200 when deps are connected).

## Secrets

All secrets come from Doppler (`{{BRAND}}-{{SLUG}}` project). See
`.doppler.yaml` for the binding.

## Cross-references

- `cloud.yaml` — deployment manifest.
- `.doppler.yaml` — Doppler binding.
- `Dockerfile` — multi-stage build.
