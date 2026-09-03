---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra build, packaging and release tooling — architecture plan

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0091, ADR-0092  
**Depends on:** repository steering, pnpm, Turborepo, TypeScript, tsup, Vitest, Oxlint, Prettier, Changesets  
**Design effort:** 15 days across 8 phases

## Purpose

One deterministic build/release system for all packages, apps, workers and services. It owns package manifests, subpath/export parity, type declarations, lint/format, dependency-boundary checks, build graph and semantic releases.

## Non-goals

Runtime application code, infrastructure provisioning or business CI workflows.

## Manager pattern

Not applicable; tooling is executable configuration and validation.

## Subpath/file layout

```text
scripts/build/{check-exports.mjs,check-boundaries.mjs,check-package-shape.mjs}
packages/tsup-config/src/{core/,index.ts}
packages/typescript-config/src/{base/,runtime/,index.ts}
.kiro/plans/2026-09-03-build-tooling-plan.md
```

## Locked standards

Every publishable package has `tsup.config.ts`, explicit `exports`, declarations/source maps, `typecheck`, Vitest and standard scripts. Every export has a matching tsup entry. Cross-package JIT execution is forbidden. Internal dependencies use `workspace:` and third-party versions use catalogs according to package conventions.

## Configuration / security

Builds are hermetic with no secrets embedded in artifacts. Reproducibility checks inspect lockfile, Node version and package manifests. Release jobs require clean git state and validated Changesets.

## Observability / errors

Validation scripts fail with actionable package/path diagnostics. CI publishes build duration, cache hit rate and failure category. No secret environment value is printed.

## Testing / conformance

Run package shape, exports, dependency-boundary, typecheck, build and test matrices. A fixture package is compiled against every supported subpath. Release dry-runs verify generated artifacts.

## Phases

1. config package audit (2d); 2. tsup/export parity (2d); 3. package-shape checks (2d); 4. dependency-boundary checks (2d); 5. Turbo graph/CI matrix (2d); 6. Changesets/release (2d); 7. reproducibility/security (2d); 8. docs (1d).

## Exit criteria

Every package has deterministic build/test/typecheck behavior; no undeclared exports or dependency edges pass CI; release artifacts are reproducible and versioned.

## Cross-references

`.kiro/steering/package-conventions.md`, `.kiro/steering/architecture.md`, `2026-09-03-testing-package.md`, ADR-0091.
