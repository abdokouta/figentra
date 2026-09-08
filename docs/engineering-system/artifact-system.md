# Engineering Artifact System

The agentic SDLC is artifact-driven. Conversation is transient; repository artifacts are durable engineering memory.

## Canonical artifact classes

| Class | Purpose | Canonical location |
|---|---|---|
| Goal / Intake | problem and desired outcome | `docs/engineering-system/work/` or product scope |
| Research | source-grounded investigation | `docs/research/` |
| PRD / Product Brief | product definition | product documentation |
| Requirement | testable behavior | `.kiro/specs/<name>/requirements.md` or equivalent |
| Bug Analysis | root cause and regression contract | `.kiro/specs/<name>/bugfix.md` or equivalent |
| Architecture | system design | `.kiro/specs/**` |
| ADR | material architecture decision | `docs/adr/` |
| Specification | implementation contract | `.kiro/plans/` / `.kiro/specs/` |
| Task Plan | executable dependency graph | `.kiro/specs/<name>/tasks.md` or plan contract |
| Review | findings and evidence | `.kiro/reports/` or change review |
| Runbook | operational procedure | `docs/runbooks/` |
| Release Record | promotion and verification | release/operations docs |
| Incident Record | operational event | operations docs |
| Agent Charter | agent authority and scope | `.kiro/agents/` + canonical registry |
| Rule / Policy / Standard | mandatory convention | `.kiro/steering/`, `.clinerules/`, canonical governance docs |
| Skill | reusable procedural knowledge | `.kiro/skills/`, `.cline/skills/` adapters |

## ADR minimum

Every material ADR contains:

- ID and status;
- date and owner;
- context/problem;
- decision;
- alternatives considered;
- consequences;
- security/data implications;
- migration implications;
- verification plan;
- related specifications and contracts.

## Provenance

Agent-authored artifacts must identify provenance according to repository governance. Generated artifacts must identify their source rather than silently becoming authoritative.

## Traceability

A production change should be traceable:

```text
Goal
 → Requirement
 → ADR / Architecture
 → Specification
 → Task
 → Code change
 → Test evidence
 → Review
 → Release
 → Runtime evidence
```

Missing links are a review finding when the change is material.

## Tool adapters

Kiro may represent requirements/design/tasks using its native Spec artifacts. Cline may use workflows, rules, skills and ordinary Markdown plans. Other tools may use their native planning format. The semantic contract remains the same.
