# Figentra Agent Engineering System

**Status:** CANONICAL ENGINEERING SYSTEM

This directory is the tool-neutral source of truth for Figentra Agentic Development: the autonomous software-development lifecycle, agent roster, routing, governance, artifact model, context model, and tool adapters.

The repository may be operated through Kiro, Cline, Claude Code, Cursor, Windsurf, or another agent runtime. Those tools are execution adapters; they must not become competing sources of engineering truth.

## Source-of-truth principle

```text
Figentra Engineering System
        |
        +-- Governance
        +-- SDLC
        +-- Agent Registry
        +-- Routing
        +-- Artifact System
        +-- Context System
        +-- Quality Gates
        |
        +-------------------------------+
        |               |               |
       Kiro           Cline          Other tools
     adapter          adapter          adapters
        |               |               |
     steering        rules/skills     native config
     agents          hooks            /rules/etc.
     skills          agents
     hooks
```

The canonical system defines **what must happen**. Each tool adapter defines **how that tool receives and executes those instructions**.

## Product alignment

This system implements the product definition in [`../figentra-agentic-development.md`](../figentra-agentic-development.md): specialized agents collaborate with engineers across requirements, architecture, implementation, testing, security, deployment and operations. Agents have explicit authority, tools, data/environment permissions, approval requirements, escalation rules and lifecycle state.

## Documents

| Document | Purpose |
|---|---|
| `constitution.md` | Non-negotiable engineering and agent laws |
| `sdlc.md` | End-to-end autonomous software lifecycle |
| `agent-roster.md` | Canonical logical agent roster and responsibilities |
| `routing.md` | Deterministic task-to-agent routing and handoffs |
| `artifact-system.md` | Canonical documents, templates, lifecycle and provenance |
| `context-system.md` | Durable project context and context-loading policy |
| `governance.md` | Authority, approvals, escalation and evidence gates |
| `quality-gates.md` | Verification gates and production completion criteria |
| `manifest/agent-registry.yaml` | Machine-readable logical agent registry |
| `manifest/artifact-registry.yaml` | Machine-readable document/artifact registry |
| `adapters/kiro.md` | Mapping to Kiro steering, agents, skills, hooks and specs |
| `adapters/cline.md` | Mapping to Cline rules, skills, hooks, agents and subagents |
| `adapters/generic.md` | Minimum contract for any future agent runtime |

## Canonical lifecycle

```text
Intake
  ↓
Discovery / Research
  ↓
Product Definition
  ↓
Requirements
  ↓
Architecture / ADR
  ↓
Technical Specification
  ↓
Implementation Plan
  ↓
Build
  ↓
Verification
  ↓
Security / Quality Review
  ↓
Release Readiness
  ↓
Deploy / Promote
  ↓
Runtime Verification
  ↓
Operate
  ↓
Learn / Improve
```

No agent may skip a required stage merely because a coding task appears simple. The orchestrator may select a lightweight path only when the governance policy explicitly allows it.

## Tool neutrality

Kiro's steering files, custom agents, skills and hooks are an adapter. Cline's rules, skills, hooks, agents and subagents are another adapter. A new tool must consume the same canonical roster, routing, governance and artifact contracts.

Do not copy the entire system into every tool. Keep tool-specific files thin and reference the canonical documents.

## Repository rule

Implementation agents must read `AGENTS.md`, the canonical architecture and the relevant implementation plan before changing production code. The engineering-system documents refine the **agent operating model**; they do not override the platform architecture.
