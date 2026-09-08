# Canonical Agent Roster

The roster defines logical responsibilities. A logical agent may be implemented as a Kiro custom agent, Cline agent, built-in workflow, subagent, human review lane, or future orchestration service. The roster does not imply one process or one deployment per role.

| ID | Agent | Primary responsibility | Can implement? | Review role |
|---|---|---|---:|---:|
| ORCH-001 | Delivery Orchestrator | classify work, build task graph, route specialists, enforce gates | No by default | Coordination |
| PROD-001 | Product Agent | goals, scope, requirements, acceptance criteria | Yes for artifacts | Product review |
| RES-001 | Research Agent | source-grounded technical/domain research | No production code | Evidence review |
| ARCH-001 | Architecture Guardian | boundaries, ADRs, dependency direction, extraction | No unless delegated | Architecture authority |
| API-001 | API Contract Designer | OpenAPI, DTOs, commands, queries, events and compatibility | Yes | Contract review |
| DATA-001 | Database Engineer | schema, migrations, transactions, indexes, locking | Yes | Data review |
| MSG-001 | Messaging Engineer | NATS, outbox, consumers, retry, DLQ, idempotency | Yes | Async review |
| WF-001 | Workflow Scheduler | workflows, timers, human tasks, schedules | Yes | Workflow review |
| SEC-001 | Security Reviewer | identity, IAM, tenancy, secrets, threats, SSRF, supply chain | No by default | Security gate |
| OBS-001 | Observability Engineer | OTel, logs, metrics, traces, SLO instrumentation | Yes | Observability gate |
| INFRA-001 | Infrastructure Engineer | AWS, Terraform, Cloudflare, networking, CI/CD, environments | Yes within policy | Infrastructure review |
| FRONT-001 | Frontend Agent | SPA, Registry UI, SDUI, accessibility, performance | Yes | UI review |
| INT-001 | Integration Engineer | OAuth, providers, webhooks, sync, reconciliation | Yes | Integration review |
| DATAAI-001 | Data & Analytics Agent | Usage, Tracking, Analytics, Reporting, Search | Yes | Data review |
| BUILD-001 | Module Builder | vertical module implementation | Yes | Owning builder |
| TEST-001 | Test Engineer | unit, integration, contract, E2E, failure, load, architecture tests | Yes | Verification authority |
| DOC-001 | Documentation Governance | specs, plans, ADRs, indexes, consistency, provenance | Yes for docs | Documentation gate |
| REL-001 | Release Operations | release readiness, deployment, rollback, SLO/runbook gate | Controlled | Release gate |
| OPS-001 | Operations Agent | diagnostics, incidents, health, controlled remediation | Controlled | Operations |
| GOV-001 | AI/Agent Governance | agent authority, registry, policy, lifecycle | Governance only | Human governance |

## Existing repository agents

The current `.kiro/agents/` roster already contains the principal platform specialists. Existing names remain canonical where they match this logical registry. Additional specialized agents may exist for frontend, native, package, documentation or product lanes; they inherit this roster's authority model.

## Agent charter minimum

Every concrete tool agent must declare:

1. stable logical ID;
2. tool-specific slug;
3. purpose;
4. owner;
5. inputs;
6. outputs;
7. allowed tools;
8. data/environment scope;
9. forbidden actions;
10. escalation conditions;
11. required resources;
12. review partners;
13. completion evidence;
14. lifecycle state.

## No role explosion

Do not create a new agent merely because a new noun appears. Add a new specialist only when the responsibility has materially different expertise, authority, context, verification, lifecycle or ownership. Otherwise route to the existing owner.
