---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra global engineering standards — enterprise plan

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0088, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** repository steering, all package plans and ADR index  
**Design effort:** 12 days across 7 phases

## Purpose

Single enforceable standard for naming, package boundaries, TypeScript, build/test manifests, dependency direction, contracts, DI, discovery, configuration, environments, security, observability, documentation and releases.

## Locked standards

`src/` is the source root; Node >=22; TypeScript strict; tsup builds publishable packages; Vitest is the standard test runner except explicitly documented RN exceptions; explicit exports are mandatory; cross-package JIT is forbidden; internal deps use workspace protocols; third-party versions use catalogs. Core packages are runtime-neutral and runtime-specific APIs stay under runtime subpaths.

Canonical vocabulary is defined once in `@stackra/contracts`. Discovery is find → registry → populator/factory. Driver-based packages use `Manager`/`MultipleInstanceManager` per ADR-0090. Environment identifiers are exactly `development`, `staging`, `production` per ADR-0088.

## Subpath/file layout

```text
.kiro/steering/                  # normative rules
.docs/adr/                       # accepted decisions
.kiro/plans/                     # implementation contracts
packages/*/src/core/             # runtime-neutral core
packages/*/src/{nestjs,react,native,worker}/
```

## Enforcement

CI checks package shape, exports, dependency graph, runtime-safe imports, canonical environment identifiers, secret patterns, formatting, typecheck, tests and Changesets. Standards are fail-closed; exceptions require an ADR.

## Security / observability

Standards require central redaction, tenant context, request/correlation/trace IDs, bounded inputs and audit events for privileged actions. Secrets never enter source, artifacts or telemetry.

## Testing / compatibility

Every standard has an executable conformance check. Changes to standards require migration guidance and impact inventory; no silent compatibility shim is permitted.

## Phases

1. consolidate standards (2d); 2. dependency/package rules (2d); 3. runtime/subpath rules (2d); 4. security/observability rules (2d); 5. CI enforcement (2d); 6. exception/migration process (1d); 7. docs/release (1d).

## Exit criteria

A new package can be scaffolded from standards without architectural invention; CI rejects boundary, export, environment and security violations.

## Cross-references

`2026-09-03-enterprise-day-one-plan-standard.md`, `2026-09-03-enterprise-plan-index.md`, `.kiro/steering/package-conventions.md`, ADR-0088/0090/0091/0092.
