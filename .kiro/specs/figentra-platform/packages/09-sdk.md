# SDK Package — Kiro Implementation Specification

**Package:** `@figentra/sdk`  
**Path:** `packages/sdk`  
**Purpose:** Typed clients for platform services.

## Package manifest (repository baseline)

> This section is generated from the current repository `package.json`. The Kiro
> spec is the target contract; if implementation changes dependencies, update
> the spec and package manifest together.

### Runtime dependencies

- _None currently._

### Development dependencies

- `@stackra/oxlint-config`
- `@stackra/prettier-config`
- `@stackra/testing`
- `@stackra/tsup-config`
- `@stackra/typescript-config`
- `@vitest/coverage-v8`
- `oxlint`
- `prettier`
- `prettier-plugin-tailwindcss`
- `tsup`
- `typescript`
- `vitest`

### Peer dependencies

- _None currently._

### Optional dependencies

- _None currently._

## 1. Boundary

This package is a reusable library/contract boundary, not a deployable service.
It owns only the concern stated above and must not accumulate unrelated platform
behavior.

**Hard rule:** must not expose database entities/repositories.

## 2. API design

- Prefer small explicit exports.
- Keep internal modules private.
- Use stable types/interfaces for public contracts.
- Avoid leaking framework-specific internals unless the package is explicitly
  framework-bound.
- Document every public export with JSDoc.
- Preserve backwards compatibility according to package semver.

## 3. Dependencies

### Runtime

- Only dependencies needed by consumers at runtime.
- Prefer platform-owned packages over duplicating infrastructure logic.

### Dev

- TypeScript strict mode.
- Vitest.
- tsup.
- Oxlint.
- Prettier.

### Peer

Use peer dependencies for consumer-provided frameworks (for example
NestJS/React) only when the package truly integrates with that framework.

### Optional

Provider-specific integrations may be optional; core exports must remain usable
without them.

## 4. Source layout

```text
src/
├── index.ts
├── public/
├── internal/
├── types/
└── adapters/        # only when required
```

## 5. Build and package exports

- ESM-first.
- Generate declarations.
- `exports` map must expose only supported entrypoints.
- No accidental deep imports.
- No source/test files in published artifacts.
- Verify package size and dependency tree in CI.

## 6. Testing

- Unit tests for every public function/type runtime behavior.
- Type-level tests for contract compatibility where applicable.
- Consumer/contract tests for SDKs and adapters.
- Browser-safety tests for packages intended for frontend use.
- No network calls in unit tests.

## 7. Documentation

README MUST include installation, imports, API examples, compatibility,
configuration and failure behavior. Public source code MUST explain non-obvious
invariants.

## 8. Security

- Never log tokens/secrets.
- Never embed environment secrets in published packages.
- Validate untrusted input at package boundaries.
- Security-sensitive helpers must have negative tests.

## 9. Versioning and release

Changes use Changesets. Breaking API changes require a major version and
migration notes. Contract/event packages require explicit compatibility review.

## 10. Acceptance

`lint` + `typecheck` + `test` + `build` + package export validation must pass
before release.
