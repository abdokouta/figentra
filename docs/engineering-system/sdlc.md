# Agentic Software Development Lifecycle

## Lifecycle

### 0. Intake

Input: goal, issue, request, incident or product opportunity.

Output: normalized problem statement, owner, scope, risk class and proposed lifecycle path.

Primary agents: delivery orchestrator, product, research as applicable.

### 1. Discovery

Establish current behavior, repository topology, dependencies, ownership, constraints and evidence. Read before designing.

Output: discovery report and source list.

### 2. Product definition

Define users, business outcome, scope, acceptance criteria, non-goals and measurable success.

Output: product brief / PRD / acceptance criteria.

### 3. Requirements

Convert the goal into testable requirements. Kiro Feature Specs use `requirements.md`; the canonical system requires the same semantic content even when another tool is used.

Output: requirements with traceable IDs and acceptance criteria.

### 4. Architecture

Determine ownership, boundaries, dependencies, data ownership, interfaces, runtime behavior and failure model. Material architecture changes require an ADR.

Output: architecture decision(s), affected contracts and migration strategy.

### 5. Specification

Translate the approved architecture into an implementation-grade contract: source layout, APIs, schemas, configuration, security, observability, testing, deployment and operations.

Output: technical specification / plan.

### 6. Planning

Break work into dependency-aware tasks. Every task has an owner, inputs, outputs, acceptance criteria and verification.

Output: implementation task graph.

### 7. Build

The owning builder implements a vertical slice. Specialists are invoked only for concerns outside the builder's authority or expertise.

### 8. Verification

Run deterministic checks first, then integration, contract, E2E, failure, concurrency, security and load checks as applicable.

### 9. Review

Architecture, security, observability and production reviewers independently inspect evidence. Findings return to the owning builder.

### 10. Release readiness

Verify artifact integrity, configuration, secrets references, migrations, health/readiness, capacity, rollback, alerts, SLOs and runbooks.

### 11. Deployment

Promotion is environment-aware and policy-controlled:

```text
Development → Validation → Staging → Verification → Production approval → Production
```

### 12. Runtime verification

Verify health, traces, metrics, error rates, business invariants and customer-facing behavior after promotion.

### 13. Operations

Monitor, diagnose, remediate within authority and record material incidents and decisions.

### 14. Continuous improvement

Convert incidents, review findings, repeated failures and useful discoveries into durable requirements, rules, ADRs, skills or implementation improvements.

## Lightweight paths

Not every change needs every artifact at maximum depth. A bugfix may use a bug analysis instead of a product requirements phase. A trivial documentation change may use a direct change path. A security-sensitive or architecture-changing task must not use a shortcut merely for speed.

The orchestrator records the selected path and why it is sufficient.

## Kiro mapping

Kiro's current Spec workflow produces `requirements.md`, `design.md` and `tasks.md`; standard Feature Specs provide approval gates, while Quick Spec removes those phase gates. Kiro also supports Bug Fix workflows and property-based correctness analysis. The canonical system maps these artifacts into the lifecycle rather than requiring Kiro-specific filenames when another tool is used.

## Failure loop

```text
Gate failure
   ↓
Classify failure
   ↓
Route to owning specialist
   ↓
Fix
   ↓
Re-run affected gate
   ↓
Continue only when evidence passes
```

A failed test is not an invitation to weaken the test without proving that the requirement was wrong.
