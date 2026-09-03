# Worker Plans

`workers/` is reserved for **independent worker applications** with a genuinely separate runtime/deployment boundary.

The default Figentra pattern is a worker **role of the owning NestJS service**, using the same service source tree and modules:

```text
services/<service>/
  ├── API role
  ├── NATS consumer role
  ├── worker role
  └── scheduler role
```

Therefore do not create `workers/notifications`, `workers/analytics`, `workers/marketing`, `workers/audit`, etc. merely because those services perform asynchronous work. Their worker instances are deployments of the corresponding service.

A top-level independent worker requires an ADR explaining why it cannot be represented as a service role. Existing exceptional workers such as gateway/registry/infrastructure-orchestrator remain only while their independent boundary is confirmed by the applicable specification/ADR.

Cloudflare Workers are a separate edge/serverless runtime and are not generic replacements for NestJS service worker roles. Containerized NestJS worker roles use Docker/Kubernetes/ECS/etc. according to infrastructure standards.
