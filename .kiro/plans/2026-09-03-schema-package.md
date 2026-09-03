---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# `@stackra/schema` — versioned validation and serialization contracts

**Status:** Planned  
**Anchor ADRs:** ADR-0012, ADR-0023, ADR-0091  
**Reference:** existing schema/validation utilities and repository standards  
**Depends on:** `@stackra/contracts`, `@stackra/support`, `@stackra/errors`  
**Design effort:** 14 days across 8 phases

## Purpose

Canonical schema definitions for runtime validation, serialization, compatibility checks, documentation generation and version negotiation. A schema is an executable contract, not a DTO annotation only.

## Non-goals

- Database schema migrations.
- HTTP routing.
- Business rules hidden inside validators.
- Vendor-specific validator APIs leaking to consumers.

## Manager pattern

No driver Manager. `SchemaRegistry` is the canonical registry; validator/serializer implementations are explicit adapters behind stable interfaces.

## Subpath layout

```text
packages/schema/
├── src/core/
│   ├── schema.module.ts
│   ├── definitions/            # schema nodes + object/array/union definitions
│   ├── validators/             # deterministic validation engine
│   ├── serializers/            # parse/serialize/normalize
│   ├── compatibility/          # backward/forward/full compatibility
│   ├── registries/             # SchemaRegistry + version index
│   ├── decorators/
│   ├── errors/
│   └── index.ts
├── src/zod/                    # optional adapter
├── src/nestjs/                 # pipes + OpenAPI integration
├── src/worker/                 # Worker-safe validation module
├── src/testing/
└── __tests__/
```

## Contracts split

`@stackra/contracts/schema` owns `ISchema`, `ISchemaRegistry`, `ISchemaValidator`, `ISchemaSerializer`, `ISchemaVersion`, compatibility results and `SCHEMA_REGISTRY`/`SCHEMA_VALIDATOR` tokens.

## Public API — locked

```ts
interface ISchema<T> {
  readonly id: string;
  readonly version: string;
  parse(input: unknown): T;
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: IValidationError };
  serialize(value: T): unknown;
}

interface ISchemaRegistry {
  register<T>(schema: ISchema<T>): void;
  get<T>(id: string, version?: string): ISchema<T>;
  compatible(id: string, from: string, to: string): ICompatibilityResult;
}
```

## Core architecture

Schemas are immutable and versioned. Validation produces structured field paths and stable error codes. Serialization MUST preserve the declared schema contract. Registries reject duplicate `(id, version)` pairs. Compatibility is explicit: additive optional fields may be backward compatible; required-field removal/type narrowing requires a major version.

## Discovery / registry

Discovery finds schema providers; `SchemaRegistry` stores and indexes them; `SchemaPopulator` loads generated/static schemas; factories construct adapter implementations. No package may maintain a second schema registry.

## Configuration / validation

Production validation is deterministic and fail-closed. Limits cover maximum object depth, array length, string size and total input bytes. Unknown fields use per-schema policy (`strip`, `preserve`, `reject`) and the policy is versioned.

## Security

Reject prototype-pollution keys, dangerous recursive inputs and oversized payloads. Never evaluate schema expressions supplied by untrusted users. Error output contains field paths and codes, not secret values. File/media schemas validate MIME and size through `@stackra/media` rather than trusting extensions.

## Errors / recovery

Malformed input returns validation errors; schema registration conflicts fail bootstrap. Serializer failures are normalized through `@stackra/errors`. No automatic fallback to an older schema is allowed unless compatibility was explicitly declared.

## Observability

Expose validation failure counters, schema version usage, parse latency and registry conflicts. Do not use raw field values as metric labels.

## Persistence / compatibility

Schemas used by events/API/queue messages are versioned independently of database migrations. Deprecation requires a published compatibility window and consumer inventory. Old versions remain readable only for the declared retention period.

## Testing / conformance

Property-based tests cover validators, malformed structures, boundary sizes and prototype-pollution cases. Contract tests verify compatibility matrices and stable serialized output. Runtime tests cover Nest/Worker adapters.

## Dependencies / exports / versioning

Core has no validator-vendor dependency. `/zod` is an optional peer adapter; `/nestjs`, `/worker`, `/testing` isolate runtime dependencies. Public schema changes require semver and Changesets.

## Phases

1. Contracts/scaffold (2d).
2. Schema node model and immutable definitions (2d).
3. Validation/serialization engine (3d).
4. Registry/discovery/populator (2d).
5. Compatibility/version policy (1d).
6. Zod/Nest/Worker adapters (1d).
7. Security/conformance tests (2d).
8. Docs/release (1d).

## Exit criteria

- Every public API/event schema has an explicit ID and version.
- Compatibility checks are deterministic and tested.
- No validator vendor leaks into core.
- Payload limits and unsafe-key rejection are enforced.

## Cross-references

- `2026-09-03-contracts-package.md`
- `2026-09-03-http-package.md`
- `2026-09-03-nats-package.md`
- `2026-09-03-queue-package.md`
- ADR-0012, ADR-0023, ADR-0091.
