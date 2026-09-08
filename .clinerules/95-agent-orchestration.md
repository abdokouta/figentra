# Figentra Agent Orchestration

Cline and Kiro share the same architectural contract but have different runtime mechanisms.

## Kiro

Use the project custom agents under `.kiro/agents/` for explicit specialist roles. Route through `.kiro/agents/ROUTING.md`.

## Cline

Use workspace `.clinerules/` for persistent rules, `.cline/skills/` for reusable on-demand knowledge, `.clinerules/workflows/` for repeatable procedures, and Cline subagents/Agent Teams for runtime delegation. Cline read-only subagents are for research and cannot edit files; implementation stays with the main task/agent. Agent Teams are for disjoint implementation lanes and should not be used to create overlapping edits.

## Canonical specialist roles

Architecture Guardian → boundaries/ADRs
Module Builder → business module implementation
API Contract Designer → HTTP/events/contracts
Database Engineer → PostgreSQL/migrations
Messaging Engineer → NATS/outbox/retry/DLQ
Workflow Scheduler → workflows/jobs/schedules
Security Reviewer → security/tenancy/authz/secrets
Observability Engineer → OTel/logs/metrics/SLOs
Infrastructure Engineer → AWS/Cloudflare/Terraform/CI/CD
Frontend Agent → SPA/Registry/SDUI/a11y
Integration Engineer → external providers/OAuth/webhooks
Data Analytics Agent → Usage/Tracking/Analytics/Reporting/Search
Test Engineer → verification and architecture tests
Release Operations → production gate/deploy/rollback
Docs Governance → plans/specs/ADR/agent consistency

## Handoff rule

Every task has one owning builder. Specialist reviewers may inspect in parallel only when their concern is independent. The owning builder integrates and fixes findings. No agent may silently change an unrelated module's ownership or architecture.
