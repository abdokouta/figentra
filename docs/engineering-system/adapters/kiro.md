# Kiro Adapter

Kiro is a first-class execution adapter for the canonical Figentra Engineering System.

## Mapping

| Canonical concept | Kiro mechanism |
|---|---|
| Universal entry | `AGENTS.md` |
| Persistent project rules | `.kiro/steering/*.md` |
| Specialist agent | `.kiro/agents/*.md` / JSON |
| On-demand procedure | `.kiro/skills/*/SKILL.md` |
| Structured feature lifecycle | `.kiro/specs/<name>/requirements.md`, `design.md`, `tasks.md` |
| Bug lifecycle | `.kiro/specs/<name>/bugfix.md`, `design.md`, `tasks.md` |
| Automated enforcement/context | `.kiro/hooks/*.json` |
| Architecture decisions | `docs/adr/` |
| Implementation contracts | `.kiro/plans/` |

## Steering rule

Kiro automatically loads workspace steering. Custom agents must explicitly include steering resources when default resource inheritance is disabled or when a deliberately narrow context is required.

Canonical adapter steering should remain thin and point to `docs/engineering-system/**` rather than copying the entire system.

## Agent rule

Every custom agent should load:

```text
AGENTS.md
.kiro/steering/**/*.md
relevant canonical architecture/plans
relevant skill(s)
```

The agent's prompt defines its role; the canonical registry defines its logical identity and authority.

## Skill rule

Use skills for procedures that should load only when relevant. Keep skill bodies focused and move large references into bundled documentation.

## Spec rule

For complex work, prefer Kiro Feature Specs. Requirements-First is appropriate when behavior is known and architecture can adapt. Design-First is appropriate when architecture or strict technical constraints lead the work. Quick Spec is acceptable only where governance permits reduced phase approvals.

## Hook rule

Hooks may enforce deterministic checks, inject context and block unsafe tool operations. Hooks must not become hidden business logic or an alternate source of governance.

## Adapter invariant

If Kiro configuration changes, update only the adapter unless the canonical engineering system itself changes.
