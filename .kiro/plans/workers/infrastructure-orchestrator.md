---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
runtime: cloudflare-worker
---

# Infrastructure Orchestrator — independent Cloudflare Worker implementation plan

## Runtime and boundary

Cloudflare Worker + Hono. This component orchestrates infrastructure control-plane actions; it does not become a generic business workflow engine or a substitute for Terraform.

## Ownership

Owns authenticated orchestration requests, execution intents, provider selection, idempotent action dispatch, reconciliation status and control-plane audit hooks. Terraform remains the source of truth for durable infrastructure resources; the Worker coordinates approved operations and status rather than inventing cloud state.

## Source layout

```text
workers/infrastructure-orchestrator/
├── src/bootstrap/
├── src/routes/{health,operations,deployments,reconcile}
├── src/domain/{operation,execution,reconciliation}
├── src/application/{commands,queries,services}
├── src/providers/{cloudflare,container,terraform}
├── src/security/{auth,authorization,secret-redaction}
├── src/queue/{dispatch,handlers,idempotency}
├── src/observability/{logging,tracing,metrics}
└── src/index.ts
├── wrangler.toml
└── __tests__/{unit,integration,contract,e2e,security}/
```

## Execution model

```text
Authenticated control request
 → validate intent/schema
 → authorize operation
 → create idempotent execution record
 → dispatch provider action
 → observe result
 → reconcile desired/current state
 → audit outcome
```

Every operation has an opaque execution ID, actor/principal attribution, target environment, requested action, desired state hash, current state, attempt count and terminal result.

## Provider boundary

Cloudflare APIs, container deployment APIs and Terraform invocation are adapters. Provider credentials never enter ordinary application state. Provider-specific models do not leak to callers; all outcomes normalize to the orchestrator contract.

## Idempotency / retries

Every mutating operation requires an idempotency key. Safe transient failures retry with bounded backoff. Provider operations that are not safely repeatable require reconciliation or status polling instead of blind retry. A successful execution remains replay-safe.

## Security

Allowlist operations and resources. Enforce environment boundaries and least-privilege provider credentials. Production mutations require explicit authorization and audit context. User-controlled URLs or provider endpoints cannot become arbitrary outbound requests.

## Reliability

The Worker is stateless between requests. Durable execution status is stored in the selected control-plane persistence boundary. Queue dispatch uses durable acknowledgement semantics. Reconciliation must recover after Worker restarts and never depend on process memory.

## Observability

Trace each control request through provider execution. Metrics cover operation latency, provider errors, retry counts, reconciliation lag and terminal failures. Logs contain execution IDs and actor context but redact secrets/provider payloads.

## Testing

Test authorization, environment isolation, operation allowlists, idempotency, provider timeouts, retry safety, duplicate delivery, reconciliation after restart, malformed provider responses and audit attribution. Use contract suites per provider adapter and real cloud/provider sandboxes for release acceptance.

## Deployment

Wrangler manages environment/bindings. Development/staging/production use isolated provider credentials and resources. Changes to Terraform-managed infrastructure are reviewed through the infrastructure pipeline; the Worker does not become an alternate unmanaged IaC source of truth.

## Exit criteria

Every orchestration operation is authorized, idempotent, observable and recoverable; provider implementations are isolated; Terraform remains authoritative; no arbitrary infrastructure command surface exists.

## Cross-references

`.kiro/specs/figentra-platform/workers/03-infrastructure-orchestrator.md`, `.kiro/plans/01-global/infrastructure-docker-terraform.md`, `.kiro/plans/workers/registry.md`.
