# ADR-0038 — Workflow Orchestration

## Status

Accepted.

## Decision

Use explicit workflow orchestration for long-running, retryable, stateful
business/infrastructure processes. Medusa-style workflow concepts may inform the
implementation, but Figentra does not copy Medusa's domain model.

Workflow steps must be idempotent and have explicit compensation/rollback
behavior where the operation is reversible.

## Consequences

Long-running operations do not depend on keeping HTTP requests alive.
