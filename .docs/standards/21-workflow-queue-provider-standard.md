# Workflow & Queue Provider Standard

## Queue

`@figentra/queue` is the single provider-neutral queue abstraction. Providers are selected by deployment/runtime: Cloudflare Queues, SQS, Redis, BullMQ or a custom adapter. Provider-specific capabilities must be exposed explicitly. Consumers must not depend on vendor-specific behavior through the common contract.

## Workflow

`@figentra/workflows` is the single provider-neutral durable workflow abstraction. Providers are Cloudflare Workflows, Temporal, Vercel Workflow SDK or custom. The provider owns persistence, retries, resumption and lifecycle. The package owns definitions, composition, Nest discovery and provider adapters.

## State machine

`@figentra/state-machines` owns synchronous/domain state transition rules. It does not persist workflow executions and does not replace a durable workflow runtime.
