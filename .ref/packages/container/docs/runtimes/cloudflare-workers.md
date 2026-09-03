# Cloudflare Workers

`@stackra/container/worker` is a thin runtime adapter. Cloudflare remains responsible for the Worker runtime and Bindings; Stackra is responsible for dependency composition and request scope.

## Basic shape

```ts
import { WorkerFactory } from "@stackra/container/worker";
import { AppModule } from "./app.module";
import { AppHandler } from "./app.handler";

export default WorkerFactory.create(AppModule, {
  handler: AppHandler,
});
```

## Runtime bindings

The adapter exposes these request-scoped tokens:

- `WORKER_ENV`
- `WORKER_REQUEST`
- `WORKER_EXECUTION_CONTEXT`
- `WORKER_CONTEXT`

Cloudflare Bindings should enter the application at the infrastructure boundary and then be hidden behind application interfaces.

```text
Cloudflare env.DB
      ↓
WORKER_ENV
      ↓
D1UserRepository
      ↓
UserRepository
      ↓
UserService
```

Do not access `env` throughout the application merely because it is available. Bindings are runtime dependencies; the DI container composes them.

## Request scope

Use `REQUEST_SCOPE` (or `Scope.REQUEST` when provided by `@stackra/contracts`) for providers that depend on request-local data.

```ts
import { Injectable, REQUEST_SCOPE, Inject } from "@stackra/container";
import { WORKER_REQUEST } from "@stackra/container/worker";

@Injectable({ scope: REQUEST_SCOPE })
export class RequestAuditService {
  constructor(
    @Inject(WORKER_REQUEST)
    private readonly request: Request,
  ) {}
}
```

A new request context is created for every `fetch` invocation and closed in a `finally` block.

## Lifecycle

Application lifecycle hooks run once when the application context bootstraps. Request-scoped providers are created lazily and are not eagerly bootstrapped.

Workers do not register `SIGTERM`, `SIGINT`, or browser `beforeunload` handlers.

## Standard Worker runtime bindings

`WorkerModule` is the declarative owner of the standard Worker DI surface. `WorkerFactory` supplies only the per-request runtime context; `WorkerModule` derives and exports:

- `WORKER_CONTEXT`
- `WORKER_ENV`
- `WORKER_REQUEST`
- `WORKER_EXECUTION_CONTEXT`

All four are request-scoped. Applications should inject these tokens rather than reading Cloudflare globals directly.

The internal `WORKER_RUNTIME_CONTEXT` token is only the bridge between the Cloudflare `fetch(request, env, ctx)` contract and the module provider graph.
