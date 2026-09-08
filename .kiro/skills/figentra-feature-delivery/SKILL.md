---
name: figentra-feature-delivery
description: Deliver a Figentra feature as a production-grade vertical slice. Use when implementing or extending a domain module, API, async flow, integration, or platform capability.
---

# Figentra Feature Delivery

1. Read `AGENTS.md`, the canonical architecture, the applicable plan, and the owning agent charter.
2. Identify the module owner and write down the exact public contracts and invariants.
3. Check whether the request creates a new package, module, persistence boundary, service, broker, runtime or control-plane component. If yes, route through the architecture guardian before implementation.
4. Implement vertically inside the owning module: domain, application, infrastructure, presentation, messaging, jobs/schedules, configuration and tests as applicable.
5. Add synchronous contracts using OpenAPI/typed interfaces and durable async contracts using NATS + outbox.
6. Make all external and asynchronous operations timeout-aware, idempotent and retry-safe.
7. Enforce tenant isolation and IAM authorization at the authoritative service/module boundary.
8. Add structured logs, metrics, traces and audit hooks appropriate to the operation.
9. Add unit, integration, contract, architecture and failure tests as applicable.
10. Run the narrowest checks, then repository standards and production-readiness checks.
11. Update plans, indexes, ADRs and changesets when the public or architectural surface changes.

Never finish with TODO architecture, fake production providers, placeholder drivers, hidden cross-module dependencies, or unverified operational behavior.