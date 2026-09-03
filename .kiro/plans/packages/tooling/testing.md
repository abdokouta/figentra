---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
---

# `@stackra/testing` — enterprise test and conformance platform

## Ownership

Owns reusable test fixtures, Vitest presets, deterministic clocks/IDs, container/runtime harnesses, contract assertions and adapter-conformance helpers. It never ships as a production dependency.

## Subpaths

```text
@stackra/testing
@stackra/testing/nestjs
@stackra/testing/worker
@stackra/testing/react
@stackra/testing/react-native
@stackra/testing/database
@stackra/testing/conformance
```

## Source layout

```text
src/core/{factories,clock,ids,assertions,presets,index.ts}
src/nestjs/{module,app-harness,index.ts}
src/worker/{workerd-harness,binding-fixtures,index.ts}
src/react/{renderers,harness,index.ts}
src/react-native/{harness,index.ts}
src/database/{pglite,fixtures,cleanup,index.ts}
src/conformance/{driver-suite,contract-suite,index.ts}
__tests__/{unit,integration,security,runtime}/
```

## Required behavior

Fixtures have explicit ownership and deterministic cleanup. Synthetic credentials only. Real integration suites use disposable infrastructure where practical. Driver-based packages consume a shared conformance suite so production providers cannot diverge silently.

## Security

Redact secrets in snapshots/logs; isolate tenant IDs, databases, queues and temporary files per test. Security fixtures cover token validation, tenant escape, privilege escalation, replay, credential rotation and webhook signature bypass.

## Exit criteria

Every package/service can run unit, integration, contract, conformance and security tests through a common framework; runtime behavior is tested in the real target runtime rather than only through mocks.
