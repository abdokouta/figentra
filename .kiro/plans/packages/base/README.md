# Base Packages

Base packages are runtime-neutral platform primitives. Every file under this directory is a full implementation contract, not a placeholder. Base packages cannot import deployable services or business modules.

## Package inventory

`contracts` — cross-service DTOs, commands, queries, events, errors and schemas.

`container` — dependency injection, scopes, providers and lifecycle.

`support` — runtime-neutral utility primitives.

`errors` — canonical typed error taxonomy/serialization.

`config` — validated immutable configuration snapshots and secret references.

`logger` — structured logging, redaction and sinks.

`observability` — OpenTelemetry tracing, metrics and propagation.

`storage` — durable key/value, secure, filesystem and object-storage abstractions.

`cache` — ephemeral caching, invalidation and stampede control.

`database` — connections, pools, transactions, migrations and DB health.

`orm` — MikroORM mapping, repositories, unit-of-work, filters and locking.

`schema` — Standard Schema validation/serialization/OpenAPI boundary.

`pagination` — request parsing and length-aware/simple/cursor paginators.

`state-machine` — generic lifecycle transition engine.

`pipeline` — ordered typed execution pipeline.

`http` — multi-connection HTTP client, connectors, middleware/interceptors and transport resilience.

`nats` — NATS/JetStream transport adapter.

`realtime` — realtime connection/subscription transport capability.

`link` — safe URL/deep-link parsing/opening boundary.

`events` — in-process event bus only.

`security` — cryptographic/security primitives and secret-safe operations.

## Ownership rules

Base packages provide reusable technical capabilities. Service business rules, service persistence models, business DTOs and provider-specific business semantics belong to deployable services. Cross-service protocol types belong to `@stackra/contracts`.

No base package may silently introduce a fake production driver. Development/test adapters must be explicitly marked and cannot be selected by production configuration.
