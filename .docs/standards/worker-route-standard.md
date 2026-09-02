# Worker Route Standard

## Decision

Cloudflare Workers use explicit route modules. Hono's `Hono` instance remains
the router; a second generic router abstraction is not required.

Route modules live under:

```text
src/routes/
├── health.route.ts
├── jobs.route.ts
├── proxy.route.ts
└── index.ts
```

## Granularity

Create one `.route.ts` file per cohesive HTTP route boundary, not one file for
every HTTP verb or trivial endpoint.

Examples:

- `health.route.ts` owns `/health/live` and `/health/ready`.
- `jobs.route.ts` owns `/v1/jobs` and `/v1/jobs/:id`.
- `proxy.route.ts` owns the Gateway's upstream forwarding boundary.

A route module owns HTTP concerns: path/method registration, request parsing,
HTTP status mapping, and response serialization. Business logic belongs in
services/use-cases.

## Composition

`routes/index.ts` composes route modules into the application. `app.ts` owns
cross-cutting middleware, bindings, security middleware, and application
composition.

## Documentation

Every exported route factory, handler function, and non-trivial route-level
constant has TSDoc/JSDoc. The documentation explains the endpoint's purpose,
authentication/authorization boundary, inputs/outputs, and important security
invariants.

## Why

This keeps route registration discoverable, testable, and easy for static/AI
scanners to inspect without creating dozens of tiny files.
