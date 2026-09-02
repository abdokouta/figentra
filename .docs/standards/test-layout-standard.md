# Test Layout Standard

Every testable artifact uses:

```text
__tests__/
├── unit/
├── integration/
├── e2e/
├── fixtures/
├── helpers/
└── vitest.setup.ts
```

Only relevant directories need to exist.

Vitest configuration uses the Stackra testing preset where applicable and the
local setup file imports `@stackra/testing/setup`.

Production `src/` must not contain test fixtures or test setup.
