---
status: canonical
component: package
package: "@stackra/pipeline"
---
# `@stackra/pipeline` — implementation plan

Composable execution pipeline for typed middleware/steps with context propagation, cancellation, deadlines, error handling and deterministic ordering.

## API
`Pipeline`, `Step`, `PipelineContext`, composition helpers, lifecycle hooks and typed result/error contracts. No HTTP-specific or framework-specific middleware assumptions in core.

## Reliability
Per-step timeout/cancellation, bounded concurrency where fan-out exists, fail-fast vs collect-error policy explicit, no hidden retries. Context carries correlation/tenant/trace metadata explicitly.

## Testing
Ordering, cancellation, timeout, error propagation, concurrency and resource cleanup.

## Exit criteria
One reusable pipeline primitive powers request/worker workflows without embedding domain logic or runtime globals.
