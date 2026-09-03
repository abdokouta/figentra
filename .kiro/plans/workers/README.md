# Worker Plans

`workers/` is reserved for genuinely independent runtime/deployment applications. The default background-processing pattern remains API/consumer/worker/scheduler roles inside the owning NestJS service.

## Canonical independent Workers

| Worker | Runtime | Purpose |
|---|---|---|
| Gateway | Cloudflare Worker + Hono | public edge routing, request normalization and upstream forwarding |
| Registry | Cloudflare Worker + Hono | application metadata/control-plane registry; D1 authoritative, KV cache |
| Infrastructure Orchestrator | Cloudflare Worker + Hono | authenticated infrastructure control/orchestration and reconciliation |

These three are explicit architecture components, not business services. The repository specifications define all three under `.kiro/specs/figentra-platform/workers/`.

## Forbidden pattern

Do not create `workers/notifications`, `workers/audit`, `workers/analytics`, `workers/search`, etc. merely because those services have asynchronous workloads. Their background execution belongs to the owning NestJS service source tree unless an ADR proves an independently deployable runtime boundary.

## Runtime rule

Cloudflare Workers are not generic replacements for NestJS workers. A Cloudflare Worker plan must explicitly define its entrypoint, bindings, state model, runtime limits, security boundary, deployment, observability and Worker-native tests. Service worker roles use the canonical NestJS source tree, Docker/container deployment where selected, durable transport, bounded concurrency, idempotency and graceful shutdown.

## Canonical plans

- `gateway.md`
- `registry.md`
- `infrastructure-orchestrator.md`
