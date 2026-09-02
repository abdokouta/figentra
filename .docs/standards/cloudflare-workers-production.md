# Cloudflare Workers Production Standard

/**
 * @file cloudflare-workers-production.md
 * @description Canonical production standard for Figentra Hono/Wrangler
 * control-plane Workers.
 *
 * This standard applies to Gateway, Application Registry, and future
 * Cloudflare-native Workers. It is intentionally stricter than a starter
 * template because these Workers sit on the platform control plane.
 */

## Required files

Every Worker must contain:

- `cloud.yaml`
- `wrangler.jsonc`
- `package.json`
- `tsconfig.json`
- `.oxlintrc.json`
- `.prettierrc`
- `src/index.ts`
- `README.md`
- tests
- `worker-configuration.d.ts` generated/synchronized with `wrangler types`

## Runtime

- Hono on Cloudflare Workers.
- Wrangler is the deployment authority.
- Cloudflare bindings are preferred over REST APIs from Worker code.
- Service Bindings are preferred for Worker-to-Worker internal calls.
- Public URLs are not used for internal control-plane hops.

Cloudflare documents Service Bindings as direct Worker-to-Worker communication
that can use HTTP forwarding or native RPC without exposing the downstream
Worker publicly. citeturn0search1turn0search0

## D1

D1 migrations are versioned under `migrations/` and applied through Wrangler.
Wrangler records applied migrations and supports remote migration execution.
citeturn0search4turn0search8

## Type generation

Run:

```bash
npx wrangler types
```

after any binding change. Hono's Cloudflare Workers documentation explicitly
uses `wrangler types` to generate the `CloudflareBindings` contract.
citeturn0search6

## Security

- Never store secrets in `wrangler.jsonc` or `cloud.yaml`.
- Validate JWT signature, issuer, and audience.
- Use short-lived audience-bound service tokens.
- Use IAM for authorization.
- Treat KV as cache only.
- Validate all registered upstreams against an allowlist.
- Use WAF/rate limiting at the Cloudflare perimeter.
- Propagate request/correlation IDs.
- Return stable error envelopes without leaking internals.

## Observability

Workers Logs/Observability must be enabled in production. Cloudflare documents
Workers Logs as the native collection path and supports OpenTelemetry,
Logpush, and Tail Workers for export. citeturn0search7turn0search9


## Official references

- Hono Cloudflare Workers starter and Wrangler workflow: https://hono.dev/docs/getting-started/cloudflare-workers
- Hono Cloudflare Workers + Vite and `cf-typegen`: https://hono.dev/docs/getting-started/cloudflare-workers-vite
- Cloudflare Service Bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare Worker observability: https://developers.cloudflare.com/workers/observability/
