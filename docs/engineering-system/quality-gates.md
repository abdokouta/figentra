# Engineering Quality Gates

A gate is evidence-based. A gate passes only when the required evidence exists and is attributable to the change.

## Gate G0 — Scope

- owner identified;
- task path selected;
- affected boundaries known;
- acceptance criteria explicit.

## Gate G1 — Architecture

- ownership is correct;
- dependency direction is valid;
- no accidental service/package proliferation;
- required ADR exists;
- data ownership is explicit.

## Gate G2 — Contracts

- HTTP/OpenAPI contracts validated;
- async subjects/schemas/versioning validated;
- compatibility impact assessed;
- errors and idempotency semantics defined.

## Gate G3 — Data

- migrations reviewed;
- constraints/indexes enforce invariants;
- transactions/locking defined;
- rollback/forward recovery considered;
- tenant isolation verified.

## Gate G4 — Implementation

- typecheck passes;
- lint/format passes;
- production paths contain no placeholders/fake providers;
- configuration is explicit;
- health/readiness is implemented.

## Gate G5 — Verification

- unit tests;
- integration tests;
- contract tests;
- E2E tests for critical paths;
- failure/retry/idempotency tests;
- architecture/import-boundary tests;
- load/concurrency tests where risk warrants.

## Gate G6 — Security

- authentication and authorization are authoritative;
- tenant boundaries verified;
- secrets isolated;
- dependency/security scans complete;
- external inputs and webhooks validated;
- dangerous tool actions remain policy-controlled.

## Gate G7 — Operations

- traces/logs/metrics exist;
- alerts/SLOs updated;
- dashboards or diagnostic queries exist where needed;
- runbook exists;
- backup/restore and disaster recovery implications considered.

## Gate G8 — Release

- artifact reproducibility;
- environment configuration;
- migration order;
- deployment strategy;
- rollback strategy;
- capacity/autoscaling;
- post-deploy verification;
- approval evidence.

## Gate result

```text
PASS     all applicable evidence present
BLOCKED  one or more required gates fail
WAIVED   explicit authorized exception with reason, owner and expiry
```

An agent must never silently convert a failure into a waiver.
