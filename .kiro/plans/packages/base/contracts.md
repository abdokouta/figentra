---
status: canonical
component: package
package: "@stackra/contracts"
---
# `@stackra/contracts` — implementation plan

Single source of truth for cross-service protocol contracts. Own versioned DTOs, schemas, commands, queries, events, errors, enums and public protocol interfaces.

## Layout
`src/{contracts,schemas,commands,queries,events,errors,enums,versions}/` plus explicit runtime-safe exports.

## Rules
Contracts are transport/domain-protocol neutral; no ORM entities, provider SDK types or service implementations. Every externally consumed contract is versioned, schema-validatable and backward-compatibility tested.

## Validation/serialization
Use the repository Standard Schema policy. JSON-safe wire forms are canonical; serialization is deterministic. Unknown-field policy and numeric/date formats are explicit per contract family.

## Compatibility
Semantic versioning, additive-first evolution, deprecation metadata and consumer conformance fixtures. Breaking changes require a new version and migration plan.

## Testing/security
Contract snapshots, schema round-trips, compatibility matrices and generated OpenAPI/event fixtures. Never embed secrets or tenant-sensitive defaults.

## Exit criteria
All cross-service protocol surfaces use this package and no service imports another service's internal contracts.
