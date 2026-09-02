# @figentra/health

Provider-neutral health semantics with thin NestJS and Worker adapters.

## Architecture

```text
NestJS adapter ──┐
Worker adapter ──┼──> @figentra/health/core
Other adapter ───┘

core ──X──> NestJS / Worker / Terminus / HTTP framework
```

The core owns registration, indicator execution, timeouts, failure isolation, probe filtering and aggregation. Adapters own framework integration and HTTP transport behavior.

## Naming standard

Use **`define*`** for declarative integration surfaces:

- `defineHealthRoutes()` defines route descriptors.
- `defineHealthController()` defines the Nest controller class from configuration.

Do not standardize `createHealthRoute()` or `createHealthHandler()`. Use `create*` only where construction of a runtime object is itself the public abstraction.

## NestJS

```ts
import { HealthModule } from "@figentra/health/nest";

@Module({
  imports: [HealthModule.forRoot({ path: "ops/health", discovery: true })],
})
export class AppModule {}
```

Indicators are automatically discovered by the Nest adapter:

```ts
@HealthIndicator({
  name: "database",
  probes: ["readiness", "startup"],
  critical: true,
  timeoutMs: 1500,
  tags: ["dependency", "database"],
})
@Injectable()
export class DatabaseHealthIndicator implements HealthIndicator {
  async check() { return { status: "up" as const }; }
}
```

The controller is factory-generated so its path is configurable, but all health decisions remain in core.

## Worker / Fetch

```ts
const routes = defineHealthRoutes({ path: "/ops/health" });
const response = await resolveHealthRoute(request, healthService, routes);
```

The route definition is framework-neutral. A Hono, Cloudflare Worker, Express or Fastify adapter can bind the definitions without moving health semantics out of core.

## Terminus

**Not required.** The implementation does not depend on `@nestjs/terminus`. Health orchestration, isolation, timeouts and aggregation are implemented in core. Terminus can only be introduced later as a separate legacy compatibility adapter.

## Response contract

```json
{
  "status": "up",
  "probe": "readiness",
  "timestamp": "2026-09-02T12:00:00.000Z",
  "durationMs": 4.2,
  "checks": {
    "database": {
      "status": "up",
      "latencyMs": 2.4,
      "details": { "pool": "healthy" }
    }
  }
}
```

The JSON is stable and transport-neutral. HTTP status mapping belongs to adapters: `down` maps to `503`; other statuses map to `200` by default.
