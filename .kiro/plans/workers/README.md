# Worker Plans

`workers/` is reserved for genuinely independent runtime/deployment applications. The default background-processing pattern remains API/consumer/worker/scheduler roles inside the owning NestJS service.

## Canonical independent Workers

| Worker | Runtime | Purpose |
|---|---|---|
| Gateway | Cloudflare Worker + Hono | public edge routing, transport security, request normalization and upstream forwarding |
| Registry | Cloudflare Worker + Hono | application metadata/control-plane registry; D1 authoritative, KV cache |
| Infrastructure Orchestrator | Cloudflare Worker + Hono | authenticated infrastructure control/orchestration and reconciliation |

These three are explicit architecture components, not business services. Repository specifications live under `.kiro/specs/figentra-platform/workers/`.

## Forbidden pattern

Do not create `workers/notifications`, `workers/audit`, `workers/analytics`, `workers/search`, etc. merely because those services have asynchronous workloads. Their background execution belongs to the owning NestJS service source tree unless an ADR proves an independently deployable runtime boundary.

## Runtime rule

Cloudflare Workers are not generic replacements for NestJS services/workers. A Cloudflare Worker plan must define entrypoint, bindings, state model, runtime limits, security boundary, deployment, observability and Worker-native tests. Business services continue to use one NestJS source tree with `api`, `consumer`, `worker`, and `scheduler` roles.

## Canonical plans

- `gateway/README.md` and `gateway/01-architecture.md` through `gateway/15-definition-of-done.md`
- `registry.md`
- `infrastructure-orchestrator.md`

The Gateway/service responsibility split is canonical in `gateway/13-service-boundary-and-redundancy.md`. Gateway centralizes public edge concerns; services retain authoritative authentication context, Tenant/IAM authorization, strict DTO/domain validation, transactions, domain errors, idempotency, service observability and all non-HTTP runtime protections.