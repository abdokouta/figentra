# Figentra Agent Routing

This routing file supersedes the older workspace-oriented routing that referenced Cloudflare Worker backend services. Figentra's canonical implementation uses modular ownership with NestJS runtime roles on AWS ECS, plus independent Cloudflare edge/control-plane Workers.

## First rule: classify ownership before implementation

1. **Architecture/boundary decision** → `figentra-architecture-guardian`
2. **Build/change a domain module** → `figentra-module-builder`
3. **HTTP/OpenAPI/event/command/query contract** → `figentra-api-contract-designer`
4. **PostgreSQL/schema/migration/transaction/locking** → `figentra-database-engineer`
5. **NATS/outbox/consumer/retry/DLQ/idempotency** → `figentra-messaging-engineer`
6. **Workflow/timer/scheduled job/human task** → `figentra-workflow-scheduler`
7. **Security/tenant/authz/secrets/SSRF/webhook review** → `figentra-security-reviewer`
8. **OTel/logs/metrics/traces/SLOs/alerts** → `figentra-observability-engineer`
9. **AWS ECS/Terraform/Cloudflare/networking/secrets/CI-CD** → `figentra-infrastructure-engineer`
10. **Frontend/SPA/Registry-driven UI/SDUI/accessibility** → `figentra-frontend-agent`
11. **Provider/OAuth/webhook/sync/integration** → `figentra-integration-engineer`
12. **Usage/Tracking/Analytics/Reporting/Search/data lifecycle** → `figentra-data-analytics-agent`
13. **Tests/architecture tests/failure/concurrency/load/security tests** → `figentra-test-engineer`
14. **Release/deploy/rollback/SLO/runbook production gate** → `figentra-release-operations`
15. **Specs/plans/ADR/README/agent routing/documentation consistency** → `figentra-docs-governance`

Existing specialized agents remain available for package/UI/native/product work when their lane is still applicable. The Figentra agents above are authoritative for the current platform architecture.

## Runtime routing

```text
Cloudflare
  ├── SPA
  ├── Gateway Worker
  ├── Application Registry Worker
  └── Infrastructure Orchestrator Worker

AWS ECS
  └── Figentra application/service runtimes
      ├── API
      ├── Worker
      └── Scheduler
```

A queue consumer or scheduler is not automatically a new service. Route the work to the owning module builder plus the messaging/workflow specialist as needed.

## Standard feature pipeline

```text
architecture-guardian
        ↓
api-contract-designer / database-engineer
        ↓
module-builder
        ↓
messaging-engineer / workflow-scheduler / integration-engineer
        ↓
test-engineer
        ↓
security-reviewer + observability-engineer
        ↓
release-operations
        ↓
docs-governance
```

Run reviewers in parallel only when their scopes do not overlap. Reviewers produce findings; the owning builder fixes them.

## Non-negotiable ownership

- Identity = authentication/principal/session orchestration.
- Tenant = tenant/organization/membership/context.
- IAM = authorization.
- Monetization = commercial entitlement.
- Workflow = durable orchestration/human tasks.
- Notifications = delivery.
- Audit = durable governance records.
- Tracking = behavioral collection.
- Analytics = analytical interpretation.
- Usage = metering.
- Registry = control-plane metadata projection, never business truth.

## Escalation

If a task would create a new service, package, persistence boundary, transport, broker, or control-plane component, `figentra-architecture-guardian` must review the proposal before implementation.
