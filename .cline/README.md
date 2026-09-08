# Figentra Cline Workspace

Cline is an execution harness for Figentra. Project rules live in `.clinerules/`; reusable knowledge lives in `.cline/skills/`; repeatable procedures live in `.clinerules/workflows/`.

## Operating model

1. Read `AGENTS.md`, `.kiro/specs/figentra-platform/ARCHITECTURE.md`, and the relevant `.kiro/plans/` contract before changing architecture or production code.
2. Use Cline Plan/Deep Planning for cross-cutting work and implementation tasks for bounded changes.
3. Use read-only subagents for repository reconnaissance before large changes; Cline subagents are intentionally research-only.
4. Use the repository's canonical module ownership and runtime contracts; never invent a competing boundary.
5. Implement → test → review → fix → commit. A green typecheck is not a production completion signal.
6. For multi-agent CLI work, use Cline Agent Teams only when the work can be partitioned into non-overlapping ownership lanes.

## Model policy

Kimi K2.5 on Bedrock is the default implementation model. Claude/GPT-class models may be used for architecture, security, concurrency, difficult debugging, or independent review. The model is replaceable; repository contracts and automated verification are authoritative.

## Cline SDK

Do not add `@cline/sdk` to the Figentra product runtime merely to make development agents work. Use the Cline CLI/IDE for normal development. Introduce the SDK only for a deliberate engineering automation product, CI agent service, or internal orchestration system with an explicit plan.
