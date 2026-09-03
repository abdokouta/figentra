---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/support"
anchor_adrs: [ADR-0091]
---
# `@stackra/support` — implementation plan

## Purpose
Runtime-neutral deterministic utility primitives shared by platform packages. Support provides assertions, Result/Option values, collections, string/URI/number helpers, timing/cancellation, immutable transformations and serialization helpers without importing application frameworks or business concepts.

## Non-goals
HTTP/database access, environment loading, logging, telemetry, domain models, business validation and provider SDKs.

## Source tree
```text
packages/support/
├── src/core/{assertions,result,option,collections,immutability,serialization,index.ts}
├── src/str/{format,parse,index.ts}
├── src/num/{parse,range,index.ts}
├── src/uri/{parser,builder,index.ts}
├── src/time/{clock,deadline,delay,index.ts}
├── src/async/{cancellation,concurrency,index.ts}
├── src/testing/{arbitraries,fixtures,index.ts}
└── __tests__/{unit,property,conformance}/
```

## Public API
```ts
Result.ok<T>(value:T); Result.err<E>(error:E);
Option.some<T>(value:T); Option.none();
assert(condition:boolean,message?:string):asserts condition;
parseIntSafe(input:unknown,options?:NumberParseOptions):number;
createDeadline(ms:number):Deadline;
withAbort<T>(signal:AbortSignal,work:()=>Promise<T>):Promise<T>;
```

Collections must have deterministic iteration semantics. Serialization helpers must be JSON-safe and stable across runtimes. Utilities return typed errors instead of silently coercing malformed input.

## Correctness/performance
Pure functions should be side-effect free and allocation-conscious on hot paths. Numeric overflow, invalid dates, malformed URLs and invalid encodings are rejected. Async helpers propagate cancellation and preserve original causes.

## Security
URI helpers reject unsafe schemes where configured. Serialization refuses functions/symbols/circular structures unless explicitly handled. No utility prints or stores secrets. Random identifiers use platform cryptographic randomness through runtime adapters.

## Testing
Boundary and property tests for collections, parsing, URI canonicalization, result/option composition, deadline/cancellation, deterministic serialization and runtime parity. Fuzz malformed input for parsers and encoders.

## Dependencies/exports
No framework/provider dependencies. Optional runtime polyfills remain explicit subpaths. Public helpers are individually exportable for tree-shaking and semver-governed.

## Implementation phases
1. Core Result/Option/assertion/collection types.
2. parsing/URI/time utilities.
3. async cancellation/concurrency helpers.
4. deterministic serialization and runtime adapters.
5. property/conformance testing and performance validation.

## Exit criteria
- Shared utility primitives replace duplicate implementations.
- No business logic is placed in Support.
- Malformed input behavior is explicit and tested.
- Runtime behavior is deterministic across supported targets.
