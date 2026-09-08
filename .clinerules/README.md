# Figentra Cline Rules

These rules are the operating contract for Cline and other coding agents working in this repository.

## Rule order
1. `00-core-architecture.md` — ownership, module-first architecture and forbidden boundaries.
2. `10-module-design.md` — vertical module structure and dependency direction.
3. `20-runtime-async.md` — API/worker/scheduler runtimes, NATS, outbox, retries and scheduling.
4. `30-security.md` — identity, IAM, tenancy, secrets, integrations and least privilege.
5. `40-observability.md` — logs, OpenTelemetry, tracking, analytics, audit and signal separation.
6. `50-cloudflare-aws.md` — edge/control-plane versus AWS compute/data-plane boundaries.
7. `60-packages.md` — package decomposition and dependency hygiene.
8. `70-development-loop.md` — plan/implement/test/review/commit workflow.
9. `80-review-gate.md` — production completion gate.

## Source of truth
The normative architecture is `.kiro/specs/figentra-platform/ARCHITECTURE.md`. Implementation contracts live under `.kiro/plans/`.

If a rule and an existing implementation disagree, do not silently preserve the implementation. Stop, identify the conflict, and update the canonical contract or implementation deliberately.

## Agent behavior
Cline must inspect relevant architecture and plans before substantial changes, search for existing capabilities before introducing new ones, keep changes bounded, run the applicable verification suite, and never claim production completion while mandatory implementation work remains unresolved.
