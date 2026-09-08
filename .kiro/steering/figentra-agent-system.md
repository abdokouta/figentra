---
inclusion: always
---

# Figentra Agent Operating Standard

This file defines how Kiro agents, Cline, and other repository-aware coding agents cooperate on Figentra. Kiro's current model supports workspace steering, custom agents, skills, hooks, permissions, MCP, and sub-agent delegation; these repository contracts are therefore the shared engineering policy rather than a model-specific prompt.

## Source-of-truth order

1. `AGENTS.md`
2. `.kiro/specs/figentra-platform/ARCHITECTURE.md`
3. the applicable `.kiro/plans/**` implementation contract
4. accepted ADRs and security/data-ownership rules
5. `.kiro/agents/ROUTING.md` and the selected agent charter
6. `.kiro/skills/**` specialized procedure
7. `.clinerules/**` Cline-specific reinforcement
8. generated code and local preference

If two repository documents conflict, stop and route the conflict to `figentra-architecture-guardian` and `figentra-docs-governance`; do not silently choose one.

## Agent roles

The canonical Figentra platform roster is:

- delivery orchestrator
- architecture guardian
- module builder
- API contract designer
- database engineer
- messaging engineer
- workflow/scheduler specialist
- security reviewer
- observability engineer
- infrastructure engineer
- frontend agent
- integration engineer
- data/analytics agent
- test engineer
- release operations
- documentation governance

Existing specialized agents outside this roster may be used when their technical lane applies, but they must obey the canonical architecture and routing rules.

## Ownership model

`Module = business ownership.`

`Runtime = execution role.`

`Deployment = infrastructure boundary.`

A module is vertically complete: domain, application, infrastructure, presentation, messaging, jobs, schedules, configuration, health and tests belong with the owner. API, worker and scheduler runtimes may execute the same application/module source tree and scale independently.

A new service/deployable is allowed only when an ADR demonstrates an independent ownership, lifecycle, security, data, scaling, dependency, deployment or organizational boundary.

## Async model

- Synchronous application contracts: HTTPS + OpenAPI/typed contracts.
- Durable async: NATS JetStream.
- Event publication: transactional outbox.
- Consumers: owned by the module that interprets the message.
- Retries: bounded, classified and idempotent.
- Poison messages: explicit DLQ/recovery policy.
- Scheduler: dispatches module-owned jobs; it does not own business logic.
- Redis: cache, rate limiting and ephemeral coordination; not the source of durable business events.

Every consumer and job must define idempotency, timeout, retry/backoff, failure classification, observability, replay/recovery and data ownership.

## Security model

Identity answers who. IAM answers whether the principal may act. Tenant owns tenancy context and membership. Monetization answers commercial availability. The owning module enforces domain rules.

Gateway is defense-in-depth. Services re-establish authoritative context and never trust client-supplied identity, tenant, role, permission or authorization-decision headers.

Secrets belong in approved secret infrastructure, never source, manifests, Registry metadata, logs, prompts, test fixtures or generated documentation.

## Registry model

Registry is a control-plane metadata projection. It may describe applications, versions, routes, capabilities, permissions, resources, events, navigation, widgets, dashboards, reports and schemas. It never becomes the source of business truth and must not contain executable code, SQL, secrets, provider credentials or live business records.

## Observability model

OpenTelemetry is the technical telemetry contract. Logs record operational/application facts; metrics measure behavior; traces explain causal request paths; Audit stores durable governance records; Tracking captures behavioral events; Analytics interprets analytical data; Usage meters consumption; Notifications deliver messages. Do not collapse these into a generic event/logging service.

## Agent execution discipline

Before writing:
- classify ownership;
- read the relevant contract;
- inspect existing patterns;
- identify impacted boundaries;
- define tests and operational evidence.

While writing:
- make the smallest coherent change;
- preserve public contracts unless the task explicitly changes them;
- keep implementation next to its owning module;
- avoid speculative abstractions;
- never add a placeholder production implementation.

After writing:
- run the narrowest relevant checks first;
- run architecture/dependency checks;
- run typecheck/lint/tests;
- verify migrations and async contracts;
- verify security/tenancy and observability;
- update docs/indexes/changesets where required;
- do not claim completion without evidence.

## Parallel work

Parallel agents are allowed only for disjoint ownership. Two agents must not modify the same file or the same business concern concurrently. Reviewers are read-first and finding-oriented; the owner fixes findings.

## Model policy

The model is replaceable. Kimi K2.5 on AWS Bedrock is an acceptable default implementation model. Claude/GPT-class models may be used for difficult architecture, security, concurrency, debugging or independent review. No model may override repository contracts.

## Production definition

Production-ready means implemented, tested, observable, secure, recoverable, migratable, deployable, rollback-capable, documented and operable. A plan, scaffold, TODO, mock-only implementation or successful typecheck is not production readiness.