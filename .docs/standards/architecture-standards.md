# Architecture Standards

- Bounded contexts own their business logic and persistence.
- Platform services expose contracts, not shared business tables.
- Authentication and authorization are separate.
- Scope is dynamic and application/domain driven.
- Infrastructure source of truth is Terraform.
- Deployable metadata is `cloud.yaml`.
- Reusable package metadata is `catalog.json`.
- Workers use Hono/Wrangler; Nest services use Nest/Fastify.
- No SDUI by default.
