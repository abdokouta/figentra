# Registry — Runtime and Edge Contract

## Runtime

Cloudflare Worker + Hono. No NestJS container, Node-only APIs or process-local authority.

## Middleware order

Request/correlation/trace context → method/header/body limits → security headers → CORS → authentication prevalidation → rate limiting → schema validation → handler → response/error normalization → telemetry flush.

## Routes

Health/liveness are public and cheap. Read routes enforce metadata visibility. Publication routes require authenticated application/service identity. Discovery routes use deterministic resolution.

## Bindings

D1 authoritative database; KV cache; Service Bindings for trusted Worker-to-Worker communication; Queues only where asynchronous reconciliation/publication work is explicitly required. Binding names are environment-specific and validated at startup.

## Limits

Explicit maximum request body, URL, headers, manifest size, D1 query/page size, response size, execution time and concurrency. Oversized requests are rejected before parsing expensive content.

## Lifecycle

Startup validates bindings/configuration and D1 schema without contacting application services. Shutdown is naturally stateless; no in-memory state is required for correctness. All durable work is restart-safe.