---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/schema"
anchor_adrs: [ADR-0091]
depends_on: ["@stackra/contracts", "@stackra/errors", "@stackra/support"]
---
# `@stackra/schema` — implementation plan

## Purpose
Canonical Standard Schema-based validation, parsing, issue normalization and serialization boundary for all HTTP/NATS/service contracts. It does not own database migration schemas, ORM metadata or business validation rules that require persistence.

## Public API
```ts
interface Schema<T> {
  parse(input:unknown):T;
  safeParse(input:unknown):SafeParseResult<T>;
  parseAsync(input:unknown):Promise<T>;
  describe():SchemaDescription;
}
interface SchemaIssue { path:readonly (string|number)[]; code:string; message:string; }
interface Serializer<T> { serialize(value:T):unknown; deserialize(input:unknown):T; }
```
Required helpers: `object`, `array`, `string`, `number`, `boolean`, `date`, `enum`, `optional`, `nullable`, `union`, `record`, `refine`, `transform`, `brand`, `lazy`.

## Source tree
```text
packages/schema/
├── src/core/{schema.ts,result.ts,issues.ts,metadata.ts,serialization.ts,index.ts}
├── src/builders/{primitives,objects,arrays,unions,refinements}
├── src/standard-schema/{adapter.ts,validation-pipe.ts,index.ts}
├── src/openapi/{generator.ts,mappers.ts,index.ts}
├── src/testing/{schema-fixture,compatibility-fixture,index.ts}
└── __tests__/{unit,conformance,integration}/
```

## Validation semantics
Validation is deterministic. Unknown-field handling is explicit per object schema (`strip`, `passthrough`, `reject`), with `reject` as the default for external commands/DTOs. Coercion is opt-in and type-specific. Numeric bounds, string lengths, array sizes, recursion depth and payload byte limits are configurable.

Business invariants that depend on databases, other aggregates or external providers remain service-domain validation, never hidden inside generic schemas.

## Serialization
Wire serialization is deterministic and JSON-safe. Dates, big integers and binary data use documented canonical representations. Serializer metadata can be used for OpenAPI generation. Deserialization must reject unsafe prototype pollution/object keys and malformed numeric/date representations.

## NestJS integration
`StandardSchemaValidationPipe` adapts schema errors into the canonical request validation response. Controllers declare DTO schemas explicitly. NestJS-specific code lives under `src/standard-schema` and is not imported by core.

## Contracts integration
`@stackra/contracts` owns cross-service DTO schemas and imports this package's primitives. A schema may be shared by request, command, query and event validation while keeping transport metadata separate.

## Security
Reject oversized inputs before deep validation where runtime supports early size checks. Limit nesting depth, array/object sizes and expensive refinements. Do not include raw input payloads in error messages. Schema transformations must not execute arbitrary code from untrusted metadata.

## OpenAPI
The OpenAPI adapter maps schema metadata to JSON Schema/OpenAPI components without changing runtime validation. Any unsupported schema construct is reported during generation rather than silently producing an incorrect document.

## Errors
`SchemaValidationError`, `SchemaCoercionError`, `SchemaSerializationError`, `SchemaDefinitionError`, `SchemaDepthExceededError`, `SchemaSizeExceededError`. Each carries normalized issues, not raw request bodies.

## Performance
Compiled schemas are reusable/immutable. Avoid recompiling a schema per request. Expensive async validators require explicit usage and bounded concurrency. Hot-path parsing avoids uncontrolled allocations where practical.

## Testing
Primitive/object/union/refinement behavior, unknown fields, coercion, recursive schemas, async validation, issue path stability, deterministic serialization, OpenAPI fixtures, compatibility snapshots and payload/depth limits. Conformance tests ensure the same schema has equivalent behavior in Node/Worker runtimes.

## Implementation phases
1. Core schema/result/issues model.
2. Primitive/composition/refinement builders.
3. serialization and Standard Schema integration.
4. NestJS pipe and OpenAPI adapter.
5. security/size limits and compiled-schema performance.
6. conformance/compatibility tests and release.

## Exit criteria
- All external HTTP/NATS/command/event payloads have explicit schemas.
- Validation behavior is deterministic and bounded.
- OpenAPI generation agrees with runtime schemas.
- Database migration schemas remain outside this package.
- No service invents a second validation framework.
