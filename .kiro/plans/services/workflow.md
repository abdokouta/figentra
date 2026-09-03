---
status: canonical
component: service
service: workflow
version: v1
runtime: nestjs
---
# Workflow Service — implementation-complete plan

## Mission
Durable orchestration control plane for long-running workflows. Owns workflow definitions, immutable versions, executions, step state, timers, retries, signals, human tasks, compensation and recovery. Business services own their aggregates and business state.

## Models
`WorkflowDefinition(id,tenantId,key,version,status,inputSchemaHash,definitionHash)`; `WorkflowRun(id,tenantId,definitionId,definitionVersion,status,idempotencyKey,inputRef,startedAt,completedAt,version)`; `WorkflowStepRun(id,runId,stepKey,attempt,status,inputRef,outputRef,startedAt,completedAt,errorCode)`; `WorkflowTimer(id,runId,stepKey,dueAt,status)`; `WorkflowSignal(id,runId,name,payloadRef,receivedAt,dedupeKey)`; `HumanTask(id,runId,assigneeRef,roleKey,status,dueAt,decision)`; `WorkflowCompensation(id,runId,stepKey,status,attempt)`.

## DTOs/interfaces
`RegisterDefinitionDto`, `StartWorkflowDto`, `SignalWorkflowDto`, `CancelWorkflowDto`, `WorkflowRunDto`, `StepCommandDto`, `HumanTaskDecisionDto`, `WorkflowQueryDto`.
```ts
interface WorkflowEngine { start(def,input,ctx):Promise<WorkflowRun>; signal(runId,name,payload):Promise<void>; cancel(runId,reason):Promise<void>; recover(runId):Promise<void>; }
interface ActivityDispatcher { dispatch(step:StepCommand):Promise<void>; }
```

## Controllers
`POST /v1/definitions`; `GET /v1/definitions/:key/:version`; `POST /v1/runs`; `GET /v1/runs/:id`; `POST /v1/runs/:id/signal`; `POST /v1/runs/:id/cancel`; `GET /v1/runs/:id/tasks`; `POST /v1/tasks/:id/decision`.

## Execution model
Every transition is a compare-and-swap on run version and produces an outbox command/event in the same transaction. Step completion is durable before advancing. External activity results include a stable activity/attempt ID. Duplicate completion is ignored after the recorded attempt state. Timers are database-backed and scheduler-driven; process memory is never authoritative.

## Cross-service interactions
Workflow calls business services through versioned contracts/commands. Identity context and IAM authorization are evaluated at workflow start and again for sensitive human/activity actions. Tenant status is checked for tenant-owned runs. Workflow never imports another service implementation or repository.

## Persistence
PostgreSQL tables above plus `workflow_outbox`, `workflow_leases`, `workflow_execution_history`. JSON payloads are bounded and may be stored in Files/object storage for large values using content references. Index tenant/status/dueAt/runId and unique idempotency keys.

## Workers/scheduler
Consumer receives workflow commands/events; worker executes ready steps and recovery; scheduler claims due timers/leases. Claims use short leases with fencing tokens. Retry/DLQ policies are bounded. Stuck runs are reconciled from durable history.

## Security/tenancy
Tenant isolation on every query. Definition registration is admin-only. Secrets are references, not payloads. Activity authorization is checked at execution. Human task actions record actor/subject and are auditable. Workflow payloads are classified and redacted from logs.

## Reliability
At-least-once commands with idempotent transitions. Retries use exponential backoff/jitter and per-step budgets. Compensation runs only for steps that declare it and only after explicit failure semantics. Partial external side effects are handled by compensating activities or reconciliation; no distributed transaction is assumed.

## Observability
Metrics: active runs, step latency, timer lag, retry count, failure rate, stuck leases, queue depth and compensation outcomes. Traces connect run/step/activity spans using correlation/causation IDs. Health checks verify database and NATS readiness.

## Testing
State-machine transition matrix, duplicate commands, crash/restart, timer recovery, lease fencing, compensation ordering, signal races, human-task authorization, tenant isolation, long-running load and migration compatibility.

## Completion gate
Durable recovery works after process loss; every workflow is versioned and immutable; no service runs a second workflow engine; no business aggregate is persisted in Workflow tables.