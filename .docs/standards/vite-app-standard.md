# Vite Application Standard

Figentra web applications use Vite, React 19, HeroUI 3, Tailwind CSS 4, React
Router 7, Stackra Query/HTTP/State packages where applicable, Oxlint, Prettier,
and Vitest.

## Required project files

```text
cloud.yaml
package.json
vite.config.ts
tsconfig.json
tsconfig.node.json
.oxlintrc.json
.prettierrc
README.md
```

Testable applications additionally contain:

```text
__tests__/
├── unit/
├── integration/
├── e2e/
├── fixtures/
└── vitest.setup.ts
```

UI composition is application-owned. Do not introduce SDUI as a default
architecture. The application consumes registry metadata for capabilities,
branding, and configuration but renders its resource UI explicitly.
