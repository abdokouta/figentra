# Plan governance

## Canonical ordering

The numbered local plan set (`00`–`44`) is a cross-package planning index. The repository's dated package plans remain canonical at package level until explicitly reconciled into the numbered index.

## Required review gates

Before implementation begins, review every package plan for:

- dependency direction and package boundary correctness
- API/contract completeness
- runtime neutrality of core code
- DI token ownership and request-scope semantics
- lifecycle/error/retry/cancellation behavior
- security, redaction, isolation and tenant boundaries
- observability and operational controls
- adapter conformance and failure tests
- public exports and semver compatibility

## No-deferral policy

The target architecture for the next 12 months is decided during planning. Do not use TODO architecture, compatibility shims as design targets, placeholder implementations, or deliberate post-implementation redesign as a phase strategy. Transitional migration code is permitted only when required to migrate an existing repository contract and must have an explicit removal condition.

## Reconciliation policy

When two plans disagree, prefer the more specific package plan for implementation detail and this master layer for cross-package invariants. Record unresolved architectural disagreements in an ADR before implementation.
