# 14 — Workflows

**Status: ACCEPTED**

**Definition/API: `@figentra/workflows` · Providers: Cloudflare Workflows,
Temporal, Vercel Workflow SDK, custom**

## Decision

`@figentra/workflows` is the single provider-neutral durable workflow API. It
owns workflow definitions, composition, Nest discovery and provider adapters.
The selected workflow provider owns durable execution, persistence, retry/resume
and instance lifecycle.

Supported providers:

- Cloudflare Workflows
- Temporal
- Vercel Workflow SDK
- custom providers implementing `WorkflowProvider`

The application uses `WorkflowClient` and does not couple business code to a
vendor-specific runtime client.

## Durable boundary

A durable side effect must have an explicit step boundary. The provider persists
successful step results and resumes from that boundary according to its own
semantics. Compensation is explicit and associated with the step that created
the side effect.

`createHook()` is composition metadata only. It is not a hidden global lifecycle
engine. If a before/after operation has independent side effects or
retry/recovery requirements, represent it as its own explicit step.

## NestJS role

NestJS is an optional discovery/DI adapter. It does not become a second workflow
runtime. A Nest application may define workflows and start them through the
provider-neutral client.

## State machines

Ordinary domain state transitions are separate from durable orchestration. Use
`@figentra/state-machines` for rules such as `draft -> submitted -> approved`.
Use `@figentra/workflows` when execution must survive failures, wait for events
or approvals, retry external effects, or run for a long time.

## Infrastructure orchestrator

`workers/infrastructure-orchestrator/src/workflows/infrastructure.workflow.ts`
is a concrete provider implementation. It defines the Terraform workflow with
`@figentra/workflows` steps and executes the definition through the native
Cloudflare adapter. This keeps the worker-specific Cloudflare entrypoint while
ensuring the workflow definition follows the same package contract as every
other application workflow.
