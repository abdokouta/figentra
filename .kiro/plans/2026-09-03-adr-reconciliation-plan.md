---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra ADR reconciliation and architecture conflict plan

**Status:** Planned  
**Anchor ADRs:** ADR-0020, ADR-0088, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** `.docs/adr/*`, `.kiro/steering/*`, `.kiro/plans/*`  
**Design effort:** 10 days across 6 phases

## Purpose

Create one traceable relationship between accepted ADRs, steering rules and implementation plans. Conflicting decisions are resolved before implementation; plans cannot silently override ADRs.

## Known reconciliation items

1. Existing package plans use `@stackra/*`; current steering contains `@figentra/*` wording. The repository package manifests currently use `@stackra/*`. This must be resolved as one explicit naming decision before implementation changes package names.
2. Older plans reference compatibility shims/drivers. Any shim retained in target architecture must be marked migration-only with owner, boundary and removal condition; otherwise remove it.
3. Cross-tab event relay belongs to `@stackra/coordinator`; duplicate event adapters are prohibited.
4. Environment identifiers are canonical `development`, `staging`, `production`; external Doppler aliases remain boundary mappings only.
5. Database and ORM ownership must remain separate.

## Method

Build an ADR-to-plan matrix containing decision, status, affected packages, enforcement mechanism and migration impact. New plans cite their governing ADRs. Contradictions become ADR amendments rather than prose exceptions.

## Non-goals

Changing accepted architecture without evidence or creating implementation work before the conflict is resolved.

## Testing / enforcement

CI checks that referenced ADR files exist, package plans cite applicable ADRs, forbidden terminology/edges are absent and migration-only compatibility code is isolated.

## Phases

1. inventory ADRs/steering (2d); 2. build traceability matrix (2d); 3. resolve naming/ownership conflicts (2d); 4. classify shims/migrations (1d); 5. update plan cross-references and CI checks (2d); 6. publish reconciliation report (1d).

## Exit criteria

No plan has an unresolved architectural conflict; every target decision traces to an accepted ADR or an explicitly approved amendment.

## Cross-references

`2026-09-03-enterprise-day-one-plan-standard.md`, `2026-09-03-global-standards-plan.md`, `2026-09-03-gap-review-and-migration-plan.md`, ADR-0088/0090/0091/0092.
