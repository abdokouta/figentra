---
status: canonical
component: package
package: "@stackra/support"
---
# `@stackra/support` — implementation plan

Runtime-neutral primitives and ergonomic helpers used across packages: assertions, result/option helpers, immutable utilities, timing/cancellation helpers, collections and deterministic serialization helpers.

## Boundary
No domain concepts, framework imports, network/database access or provider SDKs. Errors use `@stackra/errors`; cross-boundary contracts use `@stackra/contracts`.

## API/testing
Every exported helper has explicit types, edge-case tests, property tests where useful and stable semver exports. Helpers must be allocation-conscious on hot paths and cancellation-safe where asynchronous.

## Exit criteria
One shared support layer replaces duplicate utility implementations without becoming a dumping ground for business logic.
