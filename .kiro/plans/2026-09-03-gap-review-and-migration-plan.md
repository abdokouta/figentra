---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra repository gap review and migration — enterprise plan

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0088, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** current repository tree, steering, ADRs, package manifests and all plan files  
**Design effort:** 14 days across 8 phases

## Purpose

Inventory the actual repository against the enterprise target architecture, identify missing packages/files/exports/configuration, classify legacy code and produce deterministic migrations. No gap is deferred as an architectural TODO.

## Scope

Packages, apps, workers, services, infrastructure manifests, scripts, CI, package exports, dependency edges, environment identifiers, secrets, tests and documentation.

## Migration classes

- **Adopt:** already compliant.
- **Refactor:** behavior retained, architecture changed.
- **Rename:** vocabulary/package path migration with explicit compatibility window.
- **Remove:** duplicate/forbidden architecture.
- **Introduce:** missing target package/capability.
- **Migrate-only adapter:** temporary boundary for a known external/legacy dependency, with owner and removal condition.

No permanent shim category exists.

## Required audits

Package-name consistency; contracts promotion; Manager/driver conformance; runtime subpath isolation; DB/ORM boundary; storage/cache distinction; discovery duplication; environment names; secrets; public exports; test presets; observability; tenant isolation; dependency cycles.

## Security / observability

Gap findings containing secrets are redacted. Every migration emits structured progress and records before/after ownership. Security gaps are release blockers according to severity.

## Testing / compatibility

Every migration has a precondition, concrete files, verification command/test and rollback or forward-fix strategy. Compatibility windows have an explicit expiry.

## Phases

1. repository inventory (2d); 2. architecture/ADR comparison (2d); 3. package/export/dependency audit (2d); 4. runtime/security audit (2d); 5. data/tenant/transport audit (2d); 6. migration matrix (2d); 7. verification automation (1d); 8. report/docs (1d).

## Exit criteria

Every identified gap maps to a concrete implementation phase or explicit ADR decision; no unresolved target architecture is hidden in a TODO.

## Cross-references

`2026-09-03-adr-reconciliation-plan.md`, `2026-09-03-implementation-checklist-plan.md`, `2026-09-03-global-standards-plan.md`.
