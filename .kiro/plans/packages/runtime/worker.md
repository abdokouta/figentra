---
status: canonical
component: package
package: "@stackra/worker"
---
# Worker Runtime — implementation plan

Runtime-neutral worker execution adapter for Node/container/edge roles: explicit invocation context, concurrency limits, cancellation, leases, retries, DLQ hooks, health/readiness and graceful drain.

## Rules
No process-global mutable business state. Every invocation receives explicit tenant/correlation/trace context. Worker runtime does not decide domain retry semantics; owning service supplies policy.

## Testing
Concurrency bounds, cancellation, shutdown drain, lease expiry, duplicate delivery, backpressure and failure injection.

## Exit criteria
All service worker roles share one execution lifecycle without duplicated worker frameworks or hidden global state.
