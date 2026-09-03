---
status: canonical
component: package
package: "@stackra/workflow"
owner: platform
---
# `@stackra/workflow` — implementation-complete plan

## Purpose
Define and invoke durable business workflows without embedding a workflow engine in each service. The package is the typed SDK boundary; the Workflow service owns durable execution state, scheduling, retries, compensation, signals and human tasks.

## Boundary
Business services own business aggregates and workflow definitions. The SDK owns step definitions, input/output contracts, execution metadata, compensation declarations and client calls. It does not own workflow persistence or another service's data.

## API
```ts
interface WorkflowDefinition<I,O> { name:string; version:string; steps:readonly WorkflowStep[]; execute(input:I,ctx:WorkflowContext):Promise<O> }
interface WorkflowStep<I,O> { name:string; version:string; execute(input:I,ctx:StepContext):Promise<O>; compensate?(output:O,ctx:StepContext):Promise<void>; retry?:RetryPolicy; timeoutMs?:number }
interface WorkflowClient { start<I>(definition:string,input:I,options?:StartOptions):Promise<WorkflowRun>; signal(runId:string,name:string,payload:unknown):Promise<void>; cancel(runId:string,reason?:string):Promise<void>; get(runId:string):Promise<WorkflowRun> }
```

## Execution semantics
Each step has a stable identity and version. Step completion is durable before the workflow advances. Retries are bounded and policy-driven. Compensation is explicit and reverse-ordered for completed compensatable steps. Timers, external signals and human tasks are represented as durable workflow commands; no process-local timer is authoritative.

## Transport
The SDK uses the canonical service contract over HTTPS/NATS as configured by the Workflow service. Commands are idempotency-keyed. Correlation/causation/trace metadata propagates on every call. The SDK never exposes the workflow service's database.

## NestJS integration
A module registers workflow definitions and validates their metadata at bootstrap. Definitions are discovered from service-owned providers. Registration publishes immutable workflow definition metadata to the Workflow service or validates against the deployed catalogue; runtime registration must be deterministic.

## Failure/recovery
Transient transport errors may retry within the client policy; business step retries are owned by the workflow definition. A timeout does not imply compensation unless the definition says so. Recovery resumes from the last durable checkpoint, not from in-memory process state.

## Security/tenancy
Workflow start/signal/cancel calls require IAM authorization in the caller and service authentication at the boundary. Tenant ID and principal context are explicit. Workflow definitions cannot access another tenant or service database.

## Testing
Definition validation, deterministic step IDs, retries, compensation ordering, timeout semantics, duplicate commands, restart recovery, signal correlation, contract compatibility and client transport failures. Integration tests run against the real Workflow service contract.

## Completion criteria
No service embeds a second workflow engine; every durable workflow has a versioned definition, typed input/output, explicit step/retry/timeout/compensation semantics and recovery tests.