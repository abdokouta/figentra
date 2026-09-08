# Figentra Technology Foundation

Canonical platform implementation uses TypeScript/NestJS application runtimes on AWS ECS, with independent Cloudflare edge/control-plane Workers where specified. Synchronous contracts use HTTPS/OpenAPI. Durable asynchronous messaging uses NATS JetStream with transactional outbox. PostgreSQL owns durable relational state, Redis provides cache/coordination, and object storage owns file bytes.

Use the canonical architecture at `.kiro/specs/figentra-platform/ARCHITECTURE.md` and the relevant `.kiro/plans/**` documents for implementation details. Do not invent alternative infrastructure or service boundaries without an ADR.

For agent engineering, `docs/engineering-system/` is the tool-neutral source of truth. Kiro-specific behavior belongs in `.kiro/`.