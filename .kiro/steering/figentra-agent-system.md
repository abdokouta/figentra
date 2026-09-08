---
inclusion: always
---

# Figentra Agent Engineering System — Kiro Adapter

The canonical, tool-neutral engineering system lives under `docs/engineering-system/`. This file is the Kiro steering adapter; do not duplicate the full policy here.

## Required canonical context

Read, as applicable:

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
- `docs/engineering-system/adapters/kiro.md`

Then load the canonical platform architecture and the relevant `.kiro/plans/**` contract.

## Kiro-specific behavior

- Use `.kiro/agents/` for specialist agent projections.
- Use `.kiro/skills/` for on-demand procedures.
- Use `.kiro/specs/` for structured requirements/design/tasks where the Kiro Spec workflow applies.
- Use `.kiro/hooks/` for deterministic enforcement and context injection.
- Keep Kiro-specific configuration thin; canonical engineering policy belongs in `docs/engineering-system/`.
- Custom agents must have access to relevant steering and skills resources.

## Completion

Use `docs/engineering-system/quality-gates.md` as the production evidence contract. Never claim completion from a plan or generated code alone.
