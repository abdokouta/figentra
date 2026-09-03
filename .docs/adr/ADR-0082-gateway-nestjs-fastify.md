# ADR-0082 — Gateway Runtime: NestJS + Fastify

## Status

Accepted — supersedes the Gateway runtime decision in ADR-0029.

## Context

Figentra has standardized its substantial backend services on NestJS, Fastify,
Pino, Nest Observe, shared health, OpenAPI, authentication, authorization, NATS,
and the shared `@figentra/*` platform packages. Keeping the public API Gateway
as a separate Hono Worker created a second application-server model for a
component that owns substantial transport, security, upstream, and policy logic.

## Decision

The canonical Figentra API Gateway is:

- NestJS 12
- Fastify 5 adapter
- Node.js 24
- container runtime
- Cloudflare as the external DNS/WAF/DDoS perimeter

The Gateway is a normal platform service under `services/gateway`.

Cloudflare Workers remain appropriate for lightweight edge/control-plane
components such as Registry and Infrastructure Orchestrator. They are not the
application Gateway runtime.

## Gateway ownership

The Gateway owns request context, authentication boundary, authorization
coordination, Registry route resolution, downstream token exchange, request
validation, rate-limit boundaries, upstream timeout/retry policy, response and
error normalization, logging, correlation/trace propagation, health, and
OpenAPI.

It does not own domain entities, service databases, domain events, or business
rules belonging to Identity, IAM, Tenant, or other services.

## Consequences

Positive:

- One backend application standard across substantial services.
- Shared Nest middleware, guards, interceptors, pipes, filters, health, logging,
  observability, and testing patterns.
- Gateway can use the same SDK, S2S authentication, NATS contracts, and platform
  packages as other services.
- Cloudflare remains a clean infrastructure perimeter instead of an application
  framework constraint.

Negative:

- The Gateway is a container workload rather than an edge-only Worker.
- Origin capacity, autoscaling, and container availability become deployment
  concerns.

## Migration rule

`workers/gateway` is not a valid deployable source. The only canonical Gateway
source is `services/gateway`.
