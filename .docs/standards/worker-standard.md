# Worker Standard

Workers use Hono + Wrangler + Cloudflare bindings.

Required:

- `cloud.yaml`
- `wrangler.jsonc`
- `worker-configuration.d.ts`
- `src/index.ts`
- `src/app.ts`
- `__tests__` where testable

Use `cf-typegen` after binding changes.

Prefer Service Bindings for private Worker-to-Worker calls.

## Routing

Use explicit `.route.ts` modules per cohesive HTTP boundary as defined in
`worker-route-standard.md`. Hono remains the router; do not add another routing
framework.

## Request context

Every Worker establishes:

- request ID
- correlation ID
- trace propagation where available

The IDs are returned in response headers and propagated to downstream calls.
