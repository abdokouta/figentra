# Registry — Dependency Graph

## Compile-time

Registry Worker → Hono/runtime → contracts/schema/validation → Cloudflare bindings. No dependency on business-service implementations.

## Runtime

```text
Gateway ───────→ Registry (route/discovery metadata)
Services ──────→ Registry (publication/discovery)
Registry ──────→ D1 (authority)
Registry ──────→ KV (cache)
Registry ──────→ Audit (durable governance hook)
```

Infrastructure Orchestrator publishes deployment metadata to Registry but does not depend on Registry for infrastructure truth.

## Rules

No circular dependency with Gateway. Registry must not call business services to resolve metadata during ordinary reads. No direct service database access. KV may depend on D1 rebuildability; D1 never depends on KV. Publication authentication uses configured identity trust material but Registry does not become the Identity service.

## Failure classification

D1 is hard for authoritative writes; KV is soft. Gateway resolution may use only policy-approved immutable cache data during D1 outage. Application startup does not depend on Registry. Audit publication failure cannot invalidate a successful metadata transaction; it creates a durable retry/audit-sync condition.