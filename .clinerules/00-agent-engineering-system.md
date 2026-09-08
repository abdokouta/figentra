# Figentra Agent Engineering System — Cline Adapter

The canonical engineering system is tool-neutral and lives under `docs/engineering-system/`. Cline rules are an adapter, not a second policy system.

## Required canonical context

Before substantial work, read:

- `AGENTS.md`
- `docs/engineering-system/README.md`
- `docs/engineering-system/constitution.md`
- `docs/engineering-system/sdlc.md`
- `docs/engineering-system/agent-roster.md`
- `docs/engineering-system/routing.md`
- `docs/engineering-system/artifact-system.md`
- `docs/engineering-system/context-system.md`
- `docs/engineering-system/governance.md`
- `docs/engineering-system/quality-gates.md`
- `docs/engineering-system/adapters/cline.md`

Then load the canonical platform architecture and relevant implementation contract.

## Rules

- Route work through the canonical roster rather than inventing a new agent role.
- Treat `.clinerules/` as Cline-specific reinforcement of canonical rules.
- Use `.cline/skills/` for progressive, task-specific procedures.
- Use Cline subagents for read-only reconnaissance, not implementation.
- Keep hooks deterministic and policy-aligned.
- Preserve the source-of-truth hierarchy.
- Never weaken a quality gate to make a task pass.
- Never claim production readiness without evidence.

## Conditional rule guidance

Cline supports path-conditional rules. Use them for frontend/backend/testing/documentation concerns that would otherwise pollute every task context. The canonical rule itself remains under `docs/engineering-system/` when it is tool-independent.
