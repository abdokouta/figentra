# Testing Standard

## Layout

All testable artifacts keep tests outside production source:

```text
__tests__/
├── unit/
├── integration/
├── e2e/
├── fixtures/
├── helpers/
└── vitest.setup.ts
```

Use only the directories relevant to the artifact.

## Vitest

Use the shared Stackra Vitest preset:

```ts
import { mergeConfig } from "vitest/config";
import preset from "@stackra/testing/preset";
```

The local `__tests__/vitest.setup.ts` imports:

```ts
import "@stackra/testing/setup";
```

Do not duplicate global test setup across individual test files.

## Scope

- Unit: isolated code.
- Integration: real adapters/bindings/dependencies where practical.
- E2E: externally observable application/Worker behavior.
- Load/security tests remain in the dedicated infrastructure test suites.

## Quality gate

The artifact must support the repository-standard `test`, `test:watch`,
`test:coverage`, and `verify` scripts where applicable.
