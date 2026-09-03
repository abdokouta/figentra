---
status: canonical
component: package
package: "@stackra/pagination"
---
# `@stackra/pagination` — implementation plan

Database/transport-neutral pagination contracts supporting offset and cursor pagination, metadata, stable ordering and typed page results.

## API
`Page<T>`, `CursorPage<T>`, `PageRequest`, `CursorRequest`, cursor codec, ordering contract and repository adapter interfaces. MikroORM integration maps to `findAndCount`/cursor queries but core remains ORM-free.

## Correctness/security
Stable unique ordering is mandatory for cursors; signed/opaque cursors prevent tampering; tenant scope is carried by the owning query context. Bounds prevent abusive page sizes.

## Testing
Boundary pages, concurrent inserts, invalid/expired/tampered cursors, deterministic ordering and adapter conformance.

## Exit criteria
All list APIs share consistent pagination semantics with no ORM or transport leakage into the core package.
