# ADR-0029 — API Gateway and Edge Boundary

## Status
Superseded by ADR-0082.

## Decision
The former Gateway decision used a Cloudflare Worker + Hono runtime. That
decision is superseded. The canonical Gateway is now a NestJS + Fastify service
under `services/gateway`; Cloudflare remains the external WAF/DDoS/DNS perimeter.
See ADR-0082.

## Consequences
The internal control plane is not unnecessarily exposed to the public Internet.
