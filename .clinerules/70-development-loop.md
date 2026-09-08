# Cline Rule: Development Loop

## Work in bounded increments
Never ask the agent to build the entire platform in one uncontrolled change. Work one capability/module or one explicit implementation-plan slice at a time.

## Required loop
```text
Read architecture
→ read relevant plan
→ inspect existing code
→ PLAN
→ implement
→ format/lint/typecheck
→ unit tests
→ integration/contract tests
→ architecture/dependency tests
→ inspect diff
→ fix failures
→ update documentation
→ commit
```

## Plan before implementation
For non-trivial changes, enumerate files to create/change, dependencies, data changes, APIs/events, failure modes, security/tenancy implications, tests and migration/rollback concerns before editing.

## No speculative code
Do not add placeholders, fake adapters, TODO architecture, dead abstractions, compatibility shims, unused providers, or interfaces without a concrete implementation requirement.

## Existing code first
Before creating a new abstraction, search the repository for an existing canonical package/module/contract that already provides it. Extend the owner instead of duplicating it.

## Tests are architecture enforcement
A task is incomplete if tests only prove the happy path. Add boundary tests for unauthorized access, tenant isolation, idempotency, retries, duplicate delivery, failure/recovery and direct-ingress safety where applicable.

## Database changes
Every schema change includes a migration, indexes/constraints as required, backward/forward compatibility analysis, data migration strategy when needed, and rollback considerations.

## Git discipline
Keep commits cohesive and reviewable. Never rewrite unrelated files. Do not commit secrets or generated credentials. Do not create branches/PRs when the repository workflow explicitly requires direct work on `main`.

## Completion standard
Do not report success until implementation, tests, documentation/contracts, configuration, migrations and deployment/runtime concerns required by the relevant plan are complete.
