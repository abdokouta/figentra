# Figentra Enterprise Build Workflow

Use for any feature that crosses a module, runtime, persistence, messaging, or infrastructure boundary.

1. Read `AGENTS.md` and the canonical architecture.
2. Identify the owning module; explicitly reject competing ownership.
3. Read the relevant implementation contract under `.kiro/plans/`.
4. Inspect existing code and tests; use read-only subagents for broad discovery.
5. Produce a bounded implementation plan before edits.
6. Implement the smallest complete production path. Do not leave architectural TODOs.
7. Add migrations, contracts, events, consumers, jobs, schedules, and configuration required by the contract.
8. Add unit, integration, contract, failure, idempotency, security, and end-to-end tests as applicable.
9. Run typecheck/lint/tests and inspect the complete diff.
10. Perform architecture/security/operability review.
11. Fix all findings and repeat verification.
12. Commit only when the definition of done is satisfied.

Never split a module into a new service merely because it has a queue consumer or scheduler. Runtime role and business ownership are separate concepts.
