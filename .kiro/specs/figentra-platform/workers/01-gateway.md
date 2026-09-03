# Gateway Worker — Kiro Implementation Specification

**Package:** `@figentra/api-gateway`  
**Runtime:** Cloudflare Worker + Hono  
**Purpose:** Cloudflare Worker + Hono edge entry point.

## Boundary

Must not own: No business/domain persistence; no final authorization authority.

## Responsibilities

- DNS/host resolution
- WAF/rate limiting
- request normalization
- token prevalidation
- correlation
- routing
- service bindings

## Request pipeline

```text
Cloudflare DNS/WAF
  → Worker
    → host/runtime resolution
      → authentication prevalidation
        → correlation + rate limits
          → Service Binding or authenticated HTTPS
            → service/application
```

## Security

- Never trust browser tenant/application IDs.
- Validate token issuer/audience/signature as configured.
- Do not make final IAM decisions solely at the edge.
- Do not expose internal container origins unnecessarily.
- Propagate request/correlation/trace context.

## Communication

Worker-to-worker uses Cloudflare Service Bindings where possible.
Worker-to-container uses authenticated HTTPS. Async work uses Cloudflare Queues.

## Persistence

Use D1/KV only for the worker's explicit control-plane/edge use case. Business
transaction data belongs in its owning service PostgreSQL database.

## Caching

Cache only immutable/safe runtime metadata or edge-safe responses.
Tenant-sensitive mutable business responses require explicit cache design and
invalidation.

## Testing

- route tests;
- auth/prevalidation tests;
- hostname resolution;
- rate-limit behavior;
- service-binding routing;
- malformed request handling;
- security/header propagation;
- failure/fallback behavior.

## OpenAPI

Document public worker endpoints with OpenAPI-compatible schemas where
applicable. Internal bindings use typed contracts.

## Acceptance

No business logic leakage, no unauthenticated protected route, deterministic
routing, observability on every request, and tests for every route and
trust-boundary failure.

## Package manifest (repository baseline)

> This section is generated from the current repository `package.json`. The Kiro
> spec is the target contract; if implementation changes dependencies, update
> the spec and package manifest together.

### Runtime dependencies

- `@figentra/observability`
- `@figentra/sdk`
- `hono`
- `hono-pino`
- `jose`
- `pino`
- `zod`

### Development dependencies

- `@stackra/oxlint-config`
- `@stackra/prettier-config`
- `@stackra/typescript-config`
- `@vitest/coverage-v8`
- `oxlint`
- `prettier`
- `prettier-plugin-tailwindcss`
- `typescript`
- `vitest`
- `wrangler`

### Peer dependencies

- _None currently._

### Optional dependencies

- _None currently._
