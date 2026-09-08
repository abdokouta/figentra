# Cline Adapter

Cline is an execution adapter for the canonical Figentra Engineering System.

## Mapping

| Canonical concept | Cline mechanism |
|---|---|
| Universal entry | `AGENTS.md` |
| Persistent rules | `.clinerules/*.md` |
| Specialist agent | `.cline/agents/` where supported |
| On-demand procedure | `.cline/skills/*/SKILL.md` |
| Lifecycle procedure | `.clinerules/workflows/` / native workflows |
| Lifecycle enforcement | `.clinerules/hooks/` |
| Read-only reconnaissance | Cline subagents |
| Architecture decisions | `docs/adr/` |
| Implementation contracts | `.kiro/plans/` and canonical engineering docs |

## Rule strategy

Cline rules are the Cline-specific projection of canonical standards. Rules should be concise, focused and conditional where possible. Do not copy the entire Kiro steering tree into Cline.

Cline supports `AGENTS.md` as a cross-tool rule source, so the universal entry remains shared.

## Skills

Use `.cline/skills/` for progressive, task-specific procedures. A Cline skill should reference canonical documents and provide tool-specific execution instructions rather than redefine architecture.

## Hooks

Use `.clinerules/hooks/` for deterministic validation, security gates and context injection. Hooks may block operations but must follow canonical governance and must not silently grant authority.

## Subagents

Cline subagents are read-only reconnaissance agents. Use them for broad repository exploration, architecture mapping and pre-edit research. Implementation remains with the owning builder.

## Workflow mapping

Cline does not need to reproduce Kiro's exact `requirements.md` → `design.md` → `tasks.md` mechanics. It must preserve the semantic lifecycle: requirements, design/ADR, implementation plan, execution, verification and release evidence.

## Adapter invariant

Changing Cline configuration does not change Figentra engineering policy. Canonical changes are made under `docs/engineering-system/` and then projected into Cline.
