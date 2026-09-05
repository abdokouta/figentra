# Infrastructure Orchestrator — Canonical Plan Set

Runtime: Cloudflare Worker + Hono. This is the authenticated infrastructure control-plane API and orchestration coordinator. Terraform/IaC remains authoritative for declarative infrastructure state; the Worker is not an arbitrary shell or Terraform execution endpoint.

## Documents

1. `01-architecture.md` — control-plane architecture and authority.
2. `02-implementation.md` — complete Worker implementation.
3. `03-api.md` — operations/deployments/reconciliation API.
4. `04-iac-and-terraform.md` — Terraform/IaC source-of-truth and execution model.
5. `05-resource-and-provider-registry.md` — provider/resource/action allowlists.
6. `06-environments-and-topology.md` — development/staging/production isolation.
7. `07-execution-and-state.md` — execution state machine and persistence.
8. `08-queues-workers-and-schedules.md` — all async execution, retries and reconciliation.
9. `09-security-and-authorization.md` — privileged infrastructure controls.
10. `10-credentials-and-secrets.md` — provider credential boundaries.
11. `11-registry-and-discovery.md` — Application Registry integration.
12. `12-observability.md` — telemetry, SLOs and operational visibility.
13. `13-resilience-and-reconciliation.md` — failure and drift recovery.
14. `14-testing.md` — unit, integration, contract, E2E, security, load and sandbox tests.
15. `15-deployment-and-operations.md` — Worker/IaC deployment and runbooks.
16. `16-definition-of-done.md` — zero-deferred production gate.

The orchestrator accepts only authenticated, authorized, allowlisted infrastructure intents. It never accepts arbitrary Terraform, shell, provider URLs or credentials from callers.