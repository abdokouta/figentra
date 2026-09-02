# ADR-0018 — NestJS Uses Fastify

**Status:** ACCEPTED

## Decision

All substantial Figentra NestJS HTTP services use `@nestjs/platform-fastify`
with Fastify 5.

Hono remains the preferred framework for Cloudflare Workers and edge APIs.

## Why

Nest supports both Express and Fastify. Fastify is the lower-overhead,
high-performance adapter and aligns with the platform's container-oriented
service model. Nest's official documentation explicitly supports the
`FastifyAdapter`. citeturn0search11turn0search12

## Boundary

```text
Cloudflare Edge → Hono Worker
                     ↓
               NestJS service
                     ↓
                  Fastify
```

Hono is not used as a replacement for NestJS inside domain services.

## Exceptions

A service may use a different runtime only with an ADR explaining the
performance, compatibility, or deployment requirement.
