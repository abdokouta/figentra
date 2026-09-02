# Figentra Workflow Runtime

This Worker is the durable execution boundary for application workflows.

## Responsibilities

- receive a workflow invocation
- resolve the immutable `workflow + version`
- execute application code through native Cloudflare `WorkflowEntrypoint`
- let Cloudflare persist/retry durable steps
- expose the bundled executable workflow inventory for deployment checks

## Non-responsibilities

- no workflow database
- no custom scheduler
- no custom retry engine
- no workflow metadata authority
- no business-domain state

The **Registry** owns workflow metadata/discovery. This Worker owns executable workflow code and durable execution.

```text
Nest application
   │
   ├─ @figentra/workflows decorators
   ├─ @figentra/registry discovery
   │
   ├────── POST registration ──────► Registry Worker / D1
   │
   └────── workflow invocation ────► Workflow Runtime Worker
                                         │
                                         ▼
                                  Cloudflare Workflow
                                         │
                                         └─ step.do()
```

The Registry is never queried to obtain executable code. A control/API layer may query Registry to resolve metadata, permissions, or an execution target, then invoke the configured Worker.

## Registry is discovery, not a code loader

The complete flow is: 

1. A Nest application boots with `@figentra/workflows` and `@figentra/registry`.
2. `WorkflowDiscoveryService` finds `@Workflow` classes and step-local decorators.
3. `RegistryService` converts them into `workflowDefinitions` and registers the immutable application version.
4. Registry exposes the inventory through `/v1/workflows` and `/v1/catalog/workflow`.
5. An API/control service resolves the workflow key/version and invokes `POST /v1/workflows/start` on this Worker using a service principal with `workflow:execute`.
6. The Worker starts a native Cloudflare Workflow instance.
7. The Worker resolves the executable handler from its deployed bundle by `workflow + version`.
8. Cloudflare persists/retries the individual `step.do()` operations.

The runtime deliberately fails closed when a workflow version exists in Registry but is not present in the deployed executable bundle. Registry metadata cannot cause arbitrary code execution.
