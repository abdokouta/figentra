# Figentra Gateway

NestJS + Fastify public API boundary. Cloudflare provides edge DNS/WAF/DDoS controls; this service owns application authentication, authorization, request context, Registry-driven routing, downstream token exchange, upstream forwarding, error normalization, OpenAPI, health and observability.

The Gateway never writes service databases or owns domain logic.
