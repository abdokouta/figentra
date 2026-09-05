# Application Registry — Canonical Plan Set

Runtime: Cloudflare Worker + Hono. The Registry is an authoritative control-plane metadata registry, not a business service.

## Documents

1. `01-architecture.md` — boundary, authority, consistency and trust model.
2. `02-implementation.md` — complete Worker/Hono implementation contract.
3. `03-data-model.md` — D1 schema, constraints, indexes and lifecycle.
4. `04-api.md` — public and service publication APIs.
5. `05-manifests.md` — manifest schema, compiler contract and projection rules.
6. `06-registries.md` — registry taxonomy and ownership of every metadata registry.
7. `07-discovery-and-resolution.md` — application, route, capability and service discovery.
8. `08-publication-and-versioning.md` — immutable publication, revisions and compatibility.
9. `09-security-and-authorization.md` — publication trust, tenant isolation and secret/code rejection.
10. `10-runtime-and-edge.md` — Hono middleware, bindings, limits and Worker lifecycle.
11. `11-observability.md` — logs, metrics, traces, SLOs and alerts.
12. `12-resilience-and-failure.md` — degradation, retries, cache recovery and reconciliation.
13. `13-testing.md` — unit, integration, contract, security, E2E, load and recovery tests.
14. `14-deployment-and-operations.md` — Wrangler, D1/KV, rollout, backup and runbooks.
15. `15-integration-contract.md` — NestJS Registry package and application integration contract.
16. `16-definition-of-done.md` — zero-deferred production acceptance gate.

D1 is authoritative. KV is disposable cache. Application manifests remain application-owned; the Registry stores validated projections only. No secrets, executable code, SQL, arbitrary URLs or business data are accepted.