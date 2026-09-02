# @figentra/workflows

Provider-neutral durable workflow contracts and composition for Figentra.

## Boundary

This package defines the programming model. The selected provider owns durable execution. Supported adapters are:

- Cloudflare Workflows
- Temporal
- Vercel Workflow SDK
- custom providers implementing `WorkflowProvider`

The same application-facing `WorkflowClient` can start, inspect, signal, cancel, pause or resume where the selected provider supports the capability.

## Design rule

A durable side effect gets an explicit step boundary. `createHook()` is composition metadata only; it is not a hidden lifecycle engine. Compensation is explicit and provider-mapped.

## State machines

Do not use workflows for ordinary domain state transitions. Use `@figentra/state-machines` for state such as `draft -> submitted -> approved`. Use this package when execution itself must be durable across retries, sleeps, approvals, crashes or long-running work.
