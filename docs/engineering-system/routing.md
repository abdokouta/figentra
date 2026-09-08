# Canonical Agent Routing

Routing is deterministic ownership classification followed by the smallest correct specialist set.

## First-pass classification

| Work signal | Primary agent | Secondary |
|---|---|---|
| New service/package/runtime boundary | Architecture Guardian | Documentation Governance |
| New business capability | Module Builder | Architecture Guardian |
| Product behavior / scope | Product Agent | Research |
| HTTP/OpenAPI/DTO contract | API Contract Designer | Module Builder |
| Database/schema/migration | Database Engineer | Test Engineer |
| NATS/outbox/consumer/retry/DLQ | Messaging Engineer | Test Engineer |
| Workflow/timer/human task | Workflow Scheduler | Messaging Engineer |
| OAuth/provider/webhook/sync | Integration Engineer | Security Reviewer |
| Identity/IAM/tenant/security | Security Reviewer | Owning builder |
| OTel/logs/metrics/traces/SLO | Observability Engineer | Release Operations |
| AWS/Terraform/Cloudflare/networking/CI | Infrastructure Engineer | Security Reviewer |
| Frontend/SDUI/accessibility | Frontend Agent | Test Engineer |
| Usage/Tracking/Analytics/Reporting/Search | Data & Analytics Agent | Database Engineer |
| Tests/failure/concurrency/load/architecture tests | Test Engineer | Owning builder |
| ADR/spec/plan/index/provenance | Documentation Governance | Architecture Guardian |
| Release/deploy/rollback/readiness | Release Operations | Infrastructure Engineer |
| Incident/diagnostics/remediation | Operations Agent | Security/Observability as applicable |
| Agent authority/policy/roster | AI/Agent Governance | Documentation Governance |

## Standard feature pipeline

```text
Delivery Orchestrator
        ↓
Architecture Guardian (when boundary/design risk exists)
        ↓
Product / Research OR API / Data design
        ↓
Module Builder
        ↓
Specialists: Messaging / Workflow / Integration / Infrastructure
        ↓
Test Engineer
        ↓
Security Reviewer + Observability Engineer
        ↓
Release Operations
        ↓
Documentation Governance
```

## Handoff contract

Every handoff contains:

- objective;
- authoritative owner;
- current state;
- inputs and links;
- constraints;
- decisions already made;
- files in scope;
- expected outputs;
- acceptance criteria;
- verification required;
- unresolved questions;
- authority level.

## Parallel execution

Parallelize only independent lanes:

```text
API contract ─────┐
DB design ────────┼──→ Builder
Threat model ─────┘

Builder ──→ Tests ──→ Review
                    ├── Security
                    └── Observability
```

Never run two writers against the same file or business concern.

## Escalation triggers

Route back to Architecture Guardian before implementation if work would introduce or change:

- a deployable service;
- a package ownership boundary;
- a database ownership boundary;
- a new broker or transport;
- a new external trust boundary;
- a new control-plane component;
- a new authorization model;
- a cross-service contract;
- a new agent authority boundary.
