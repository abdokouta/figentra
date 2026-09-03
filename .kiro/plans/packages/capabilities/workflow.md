---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
component: package
package: "@stackra/workflow"
anchor_adrs: [ADR-0024, ADR-0025, ADR-0090, ADR-0091, ADR-0092]
depends_on: ["@stackra/contracts", "@stackra/container", "@stackra/schema", "@stackra/errors", "@stackra/nats"]
---
# `@stackra/workflow` — implementation plan

## Purpose and boundary
Reusable typed SDK for defining and invoking durable business workflows. Business services own workflow definitions, business aggregates and activity implementations. The Workflow service owns durable execution state, timers, retries, compensation, signals, leases and human tasks. The SDK contains no second workflow engine and no durable business database.

## Source tree
```text
packages/workflow/
├── src/core/{definition,step,context,workflow-builder,client,commands,events,errors,index.ts}
├── src/nestjs/{workflow.module.ts,discovery,registration,index.ts}
├── src/runtime/{node,worker,index.ts}
├── src/testing/{definition-fixture,mock-client,step-fixture,index.ts}
└── __tests__/{unit,integration,conformance}/
```

## Public API
```ts
interface WorkflowDefinition<I,O> {
  readonly name:string;
  readonly version:string;
  readonly input:Schema<I>;
  readonly output:Schema<O>;
  readonly steps:readonly WorkflowStep[];
}
interface WorkflowStep<I,O> {
  readonly key:string;
  readonly version:string;
  readonly timeoutMs:number;
  readonly retry:RetryPolicy;
  execute(ctx:StepContext,input:I):Promise<O>;
  compensate?(ctx:StepContext,output:O):Promise<void>;
}
interface WorkflowClient {
  start<I>(definition:string,input:I,options?:StartOptions):Promise<WorkflowRunView>;
  signal(runId:string,name:string,payload:unknown):Promise<void>;
  cancel(runId:string,reason:string):Promise<void>;
  get(runId:string):Promise<WorkflowRunView>;
  wait(runId:string,options?:WaitOptions):Promise<WorkflowRunView>;
}
```

## Definition model
A published definition is immutable and identified by `(tenantId,name,version)`. Every step has a stable key/version, input/output schema reference, timeout, retry policy, compensation declaration and activity reference. Definition hashes are calculated from canonical serialized metadata so drift is detectable.

## Execution contract
The SDK sends versioned commands to Workflow service. Commands carry idempotency key, request/correlation/causation/trace context and tenant/principal context. The SDK never assumes a process-local timer or local execution checkpoint is authoritative.

## Step/activity boundary
A workflow step invokes a service-owned activity through an explicit activity reference. The SDK serializes inputs/outputs according to contract schemas and returns/awaits durable Workflow service state. Activities cannot write Workflow tables directly and cannot access another service's repository.

## Retry/timeout/compensation semantics
Retry policy is explicit: max attempts, backoff, jitter and retryable error categories. Timeout is terminal for the attempt unless the definition declares a retry. Compensation is a separate declared action and never inferred from arbitrary errors. Completed compensatable steps are compensated in reverse durable order according to the Workflow service state machine.

## NestJS discovery
`WorkflowModule` discovers providers decorated with workflow metadata, validates definition uniqueness/hash/schema, and registers metadata deterministically. Duplicate published version registration is a fatal configuration error. Discovery does not execute business code.

## Transport
HTTPS/OpenAPI is synchronous default. NATS/JetStream is used for durable asynchronous workflow commands/events. The SDK can use either through a transport adapter; transport/provider types never leak into definition code. Outbound calls use bounded deadlines and idempotency.

## Security/tenancy
Caller must authenticate through Identity and authorize workflow operation through IAM. Tenant ID is explicit/trusted context, never inferred from workflow payload. Workflow definitions cannot embed secrets or arbitrary code into serializable metadata. Activity results containing restricted data use classification and bounded storage/reference policies.

## Errors/recovery
`WorkflowDefinitionError`, `WorkflowRegistrationError`, `WorkflowTransportError`, `WorkflowTimeoutError`, `WorkflowRejectedError`, `WorkflowRunNotFoundError`, `WorkflowVersionConflictError`. Client-side transport errors may retry when operation is idempotent. Business retries remain owned by definition metadata/Workflow service.

## Observability
Every client operation propagates correlation/causation/trace IDs. Metrics: start latency, command retries, workflow rejection rate, wait latency and transport errors. Spans include definition/run/step IDs but not business payloads. SDK telemetry must be non-fatal.

## Configuration
Workflow service endpoint, transport mode, request deadline, retry budget, service identity reference, tenant/context policy and payload size limits are schema validated. Missing production endpoint/identity is a startup error.

## Testing
Definition schema validation; duplicate/version detection; stable definition hash; command idempotency; transport retry; timeout; cancellation; signal delivery; workflow-version compatibility; compensation metadata; NestJS discovery; real Workflow service contract integration.

## Implementation phases
1. Core definition/step/schema/context types.
2. Workflow client and command/event contracts.
3. NestJS discovery/registration.
4. HTTP/NATS transport adapters and error handling.
5. testing/conformance/observability/security.
6. production integration with Workflow service and migration/version verification.

## Exit criteria
- Business services define workflows without embedding an engine.
- Every published workflow is immutable/versioned/hash-identified.
- Steps have explicit timeout/retry/compensation semantics.
- Calls to Workflow service are idempotent and tenant-aware.
- No Workflow persistence or cross-service repository dependency exists in the SDK.
