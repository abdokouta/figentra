# Worker Plans

`workers/` is reserved for genuinely independent runtime/deployment applications. The default background-processing pattern remains API/consumer/worker/scheduler roles inside the owning NestJS service.

## Canonical independent Workers

| Worker | Runtime | Purpose |
|---|---|---|
| Gateway | Cloudflare Worker + Hono | public edge routing, transport security, request normalization and upstream forwarding |
| Registry | Cloudflare Worker + Hono | application/platform metadata and discovery control plane; D1 authoritative, KV cache |
| Infrastructure Orchestrator | Cloudflare Worker + Hono | authenticated infrastructure control-plane execution and reconciliation |

These three are independent architecture components, not business services.

## Forbidden pattern

Do not create `workers/notifications`, `workers/audit`, `workers/analytics`, `workers/search`, etc. merely because those services have asynchronous workloads. Their background execution belongs to the owning NestJS service source tree unless an ADR proves an independently deployable runtime boundary.

## Runtime rule

Cloudflare Workers are not generic replacements for NestJS services/workers. Every independent Worker plan must define entrypoint, bindings, state model, runtime limits, security boundary, deployment, observability and Worker-native tests. Business services continue to use one NestJS source tree with `api`, `consumer`, `worker`, and `scheduler` roles.

## Canonical plans

- `gateway/README.md` and the complete numbered Gateway plan set.
- `registry/README.md` and the complete numbered Registry plan set.
- `infrastructure-orchestrator/README.md` and the complete numbered Infrastructure Orchestrator plan set.

There are no competing flat Worker implementation plans. The Gateway/service responsibility split is canonical in `gateway/15-service-boundary-and-redundancy.md` and the service-specific `22-gateway-boundary-and-redundancy.md` documents. Gateway centralizes public edge concerns; services retain authoritative authentication context, Tenant/IAM authorization, strict DTO/domain validation, transactions, domain errors, idempotency, service observability and non-HTTP runtime protections.