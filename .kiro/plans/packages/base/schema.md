---
status: canonical
component: package
package: "@stackra/schema"
---
# `@stackra/schema` — implementation plan

Canonical validation/schema abstraction based on the repository Standard Schema policy. Owns schema composition, validation and serialization boundaries; it does not own database schemas.

## API
Typed schema definitions, parse/safeParse, async validation, issue normalization, JSON/wire serialization metadata and adapter interfaces. Integrate with NestJS `StandardSchemaValidationPipe` and OpenAPI generation without coupling core to Nest.

## Security/performance
Bound input size, reject unsafe coercions, deterministic serialization and safe error reporting. Reuse compiled schemas where supported.

## Testing
Schema conformance, malformed payloads, async validation, serialization round-trip, OpenAPI fixtures and backward compatibility.

## Exit criteria
All HTTP/NATS/queue boundary validation uses one schema policy and database migration schemas remain owned by database tooling.
