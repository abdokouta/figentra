# `.ref/` — aspirational reference material

This folder holds steering docs and agent charters that are **not yet active**
in this workspace. They describe concerns that will land as the platform matures
(mobile, HeroUI, zones, navigation, dashboard widgets, growth signals, SDUI,
product-lead, design-lead, MLOps, incident command, etc.).

## Structure

```text
.ref/
├── steering/    # 28 aspirational steering docs (moved from .kiro/steering/)
├── agents/      # 44 aspirational agent charters (moved from .kiro/agents/)
├── packages/    # Reference package architecture snapshots
├── schemas/     # JSON Schemas (catalog.v1.json, etc.)
└── README.md    # This file
```

## Promotion back to `.kiro/`

When a concern lands in the workspace (a package is scaffolded, a service is
deployed, a runtime is adopted), the corresponding doc moves **back** from
`.ref/` into `.kiro/`:

```bash
# Example: promoting the HeroUI license doc when HeroUI ships.
mv .ref/steering/heroui-pro-license.md .kiro/steering/
# Then update .kiro/steering/INDEX.md to list the promoted doc.
```

The move is a single commit per concern, with a note in the commit body
naming why the concern is now active.

## Why the split

The workspace's `.kiro/steering/` had 62 docs and `.kiro/agents/` had 60
charters. Most agents load steering into context at session start — 62 docs
is ~40k tokens of rules for a workspace that's still laying foundational
config. The triage (Task 4 of the 2026-09-03 workspace-standardization plan)
splits the surface into "active now" vs "reference for later" so the AI
context stays lean.

## Rules

- **Never delete** a doc from `.ref/`. It's reference material, not dead code.
- **Never edit** a `.ref/` doc to reflect current-workspace state — it's a
  snapshot of the aspirational target. Edits happen after promotion to `.kiro/`.
- **`.ref/` is gitignored from Prettier** (already in `.prettierignore`) and
  allowlisted in `.gitleaks.toml` (already present).
